// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SafePot {
    IERC20 public usdcToken;
    uint256 public constant CREATION_FEE = 500000; // 0.5 USDC (6 decimals)
    
    struct Group {
        uint256 id;
        string name;
        uint256 maxMembers;
        uint256 contributionAmount;
        string roundDuration; // e.g. "weekly", "monthly"
        address[] members;
        uint256 currentRound;
        uint256 potBalance;
        uint256 currentTurnIndex; // which member gets the pot this round
        bool isComplete;
        bool isPrivate;
        string inviteCode;
    }

    uint256 public nextGroupId = 1;
    mapping(uint256 => Group) public groups;
    // Mapping from groupId to member address to contribution in current round
    mapping(uint256 => mapping(address => uint256)) public memberContributions;
    
    // Mapping from invite code to group ID
    mapping(string => uint256) public inviteCodeToGroupId;

    // Track remaining installments for a winner
    mapping(uint256 => mapping(address => uint256)) public pendingInstallments;
    // Track the amount per installment for a winner
    mapping(uint256 => mapping(address => uint256)) public installmentAmount;
    // Track the inviter of each member in private groups
    mapping(uint256 => mapping(address => address)) public inviterOf;
    // Track whether a member has rugged
    mapping(uint256 => mapping(address => bool)) public hasRugged;

    event GroupCreated(uint256 indexed groupId, string name, address creator);
    event JoinedGroup(uint256 indexed groupId, address member);
    event ContributionMade(uint256 indexed groupId, address member, uint256 amount);
    event PotDistributed(uint256 indexed groupId, address winner, uint256 amount);

    constructor(address _usdcToken) {
        usdcToken = IERC20(_usdcToken);
    }

    function createGroup(string memory name, uint256 maxMembers, uint256 contributionAmount, string memory roundDuration, bool isPrivate, string memory inviteCode) external {
        require(maxMembers >= 2 && maxMembers <= 10, "Members must be between 2 and 10");
        
        // Transfer 0.5 USDC creation fee to contract
        require(usdcToken.transferFrom(msg.sender, address(this), CREATION_FEE), "Fee transfer failed");

        Group storage newGroup = groups[nextGroupId];
        newGroup.id = nextGroupId;
        newGroup.name = name;
        newGroup.maxMembers = maxMembers;
        newGroup.contributionAmount = contributionAmount;
        newGroup.roundDuration = roundDuration;
        newGroup.currentRound = 1;
        newGroup.currentTurnIndex = 0;
        newGroup.isPrivate = isPrivate;
        
        if (isPrivate) {
            require(bytes(inviteCode).length > 0, "Invite code required for private groups");
            require(inviteCodeToGroupId[inviteCode] == 0, "Invite code already used");
            newGroup.inviteCode = inviteCode;
            inviteCodeToGroupId[inviteCode] = nextGroupId;
        }
        
        // Creator automatically joins
        newGroup.members.push(msg.sender);
        inviterOf[nextGroupId][msg.sender] = msg.sender;
        
        emit GroupCreated(nextGroupId, name, msg.sender);
        nextGroupId++;
    }

    function joinGroup(uint256 groupId) external {
        Group storage group = groups[groupId];
        require(group.id != 0, "Group does not exist");
        require(!group.isPrivate, "Cannot join private group via this method");
        require(group.members.length < group.maxMembers, "Group is full");
        
        for (uint i = 0; i < group.members.length; i++) {
            require(group.members[i] != msg.sender, "Already a member");
        }
        
        group.members.push(msg.sender);
        emit JoinedGroup(groupId, msg.sender);
    }

    function joinPrivateGroup(uint256 groupId, string memory inviteCode) external {
        Group storage group = groups[groupId];
        require(group.id != 0, "Group does not exist");
        require(group.isPrivate, "Not a private group");
        require(keccak256(abi.encodePacked(group.inviteCode)) == keccak256(abi.encodePacked(inviteCode)), "Invalid invite code");
        require(group.members.length < group.maxMembers, "Group is full");
        
        for (uint i = 0; i < group.members.length; i++) {
            require(group.members[i] != msg.sender, "Already a member");
        }
        
        group.members.push(msg.sender);
        inviterOf[groupId][msg.sender] = group.members[0]; // The creator is the default inviter
        emit JoinedGroup(groupId, msg.sender);
    }

    function contribute(uint256 groupId) external {
        Group storage group = groups[groupId];
        require(group.id != 0, "Group does not exist");
        require(!group.isComplete, "Group cycle is complete");
        
        bool isMember = false;
        for (uint i = 0; i < group.members.length; i++) {
            if (group.members[i] == msg.sender) {
                isMember = true;
                break;
            }
        }
        require(isMember, "Not a member");
        require(memberContributions[groupId][msg.sender] < group.currentRound, "Already contributed this round");

        // Transfer contribution
        require(usdcToken.transferFrom(msg.sender, address(this), group.contributionAmount), "Transfer failed");
        
        memberContributions[groupId][msg.sender] = group.currentRound;
        group.potBalance += group.contributionAmount;
        
        emit ContributionMade(groupId, msg.sender, group.contributionAmount);

        // Check if round is complete (all non-rugged members contributed)
        if (group.members.length == group.maxMembers) {
            bool roundComplete = true;
            for (uint i = 0; i < group.members.length; i++) {
                address m = group.members[i];
                if (!hasRugged[groupId][m] && memberContributions[groupId][m] < group.currentRound) {
                    roundComplete = false;
                    break;
                }
            }

            if (roundComplete) {
                distributePot(groupId);
            }
        }
    }

    // Internal function called when a round is complete
    function distributePot(uint256 groupId) internal {
        Group storage group = groups[groupId];
        require(group.potBalance > 0, "Pot is empty");
        
        // --- GRADUAL RELEASE FOR PAST WINNERS ---
        gradualRelease(groupId);
        
        // Skip rugged members for the current turn
        while (group.currentTurnIndex < group.members.length && hasRugged[groupId][group.members[group.currentTurnIndex]]) {
            group.currentTurnIndex++;
        }
        
        if (group.currentTurnIndex >= group.members.length) {
            group.isComplete = true;
            return;
        }

        address winner = group.members[group.currentTurnIndex];
        uint256 amount = group.potBalance;
        group.potBalance = 0;
        
        // Calculate remaining non-rugged rounds
        uint256 remainingRounds = 0;
        for(uint i = group.currentTurnIndex + 1; i < group.members.length; i++) {
            if(!hasRugged[groupId][group.members[i]]) {
                remainingRounds++;
            }
        }
        
        if (!group.isPrivate) {
            // Public: 0% immediate, 100% gradual
            if (remainingRounds > 0) {
                pendingInstallments[groupId][winner] = remainingRounds;
                installmentAmount[groupId][winner] = amount / remainingRounds;
            } else {
                _safeTransfer(groupId, winner, amount);
            }
        } else {
            // Private: 70% immediate, 30% gradual
            uint256 immediateAmount = (amount * 70) / 100;
            uint256 heldAmount = amount - immediateAmount;
            
            if (remainingRounds > 0) {
                pendingInstallments[groupId][winner] = remainingRounds;
                installmentAmount[groupId][winner] = heldAmount / remainingRounds;
            } else {
                immediateAmount = amount; 
            }
            _safeTransfer(groupId, winner, immediateAmount);
        }
        
        group.currentTurnIndex++;
        
        // Check if all remaining are rugged
        bool anyLeft = false;
        for(uint i = group.currentTurnIndex; i < group.members.length; i++) {
            if(!hasRugged[groupId][group.members[i]]) {
                anyLeft = true;
                break;
            }
        }
        
        if (!anyLeft) {
            group.isComplete = true;
        } else {
            group.currentRound++;
        }
    }

    function gradualRelease(uint256 groupId) internal {
        Group storage group = groups[groupId];
        for (uint i = 0; i < group.currentTurnIndex; i++) {
            address pastWinner = group.members[i];
            if (!hasRugged[groupId][pastWinner] && pendingInstallments[groupId][pastWinner] > 0) {
                uint256 instAmount = installmentAmount[groupId][pastWinner];
                pendingInstallments[groupId][pastWinner]--;
                _safeTransfer(groupId, pastWinner, instAmount);
            }
        }
    }

    function _safeTransfer(uint256 groupId, address to, uint256 amount) internal {
        if (amount > 0) {
            require(usdcToken.transfer(to, amount), "Transfer failed");
            emit PotDistributed(groupId, to, amount);
        }
    }

    function _verifyMember(uint256 groupId, address account) internal view returns (bool) {
        address[] memory m = groups[groupId].members;
        for (uint i = 0; i < m.length; i++) {
            if (m[i] == account) return true;
        }
        return false;
    }

    function slashInviter(uint256 groupId, address memberId) external {
        require(_verifyMember(groupId, msg.sender), "Not a member");
        Group storage group = groups[groupId];
        require(group.isPrivate, "Only private groups");
        require(!hasRugged[groupId][memberId], "Already rugged");
        
        hasRugged[groupId][memberId] = true;
        
        uint256 remaining = pendingInstallments[groupId][memberId] * installmentAmount[groupId][memberId];
        pendingInstallments[groupId][memberId] = 0;
        if (remaining > 0) group.potBalance += remaining;
        
        address inviter = inviterOf[groupId][memberId];
        if (inviter != address(0) && inviter != memberId) {
            uint256 inviterRemaining = pendingInstallments[groupId][inviter] * installmentAmount[groupId][inviter];
            pendingInstallments[groupId][inviter] = 0;
            if (inviterRemaining > 0) group.potBalance += inviterRemaining;
        }
    }
    
    function slashPublicMember(uint256 groupId, address memberId) external {
        require(_verifyMember(groupId, msg.sender), "Not a member");
        Group storage group = groups[groupId];
        require(!group.isPrivate, "Only public groups");
        require(!hasRugged[groupId][memberId], "Already rugged");
        
        hasRugged[groupId][memberId] = true;
        
        uint256 remaining = pendingInstallments[groupId][memberId] * installmentAmount[groupId][memberId];
        pendingInstallments[groupId][memberId] = 0;
        if (remaining > 0) group.potBalance += remaining;
    }

    function getGroup(uint256 groupId) external view returns (
        uint256 id,
        string memory name,
        uint256 maxMembers,
        uint256 contributionAmount,
        string memory roundDuration,
        address[] memory members,
        uint256 currentRound,
        uint256 potBalance,
        uint256 currentTurnIndex,
        bool isComplete,
        bool isPrivate,
        string memory inviteCode
    ) {
        Group storage group = groups[groupId];
        return (
            group.id,
            group.name,
            group.maxMembers,
            group.contributionAmount,
            group.roundDuration,
            group.members,
            group.currentRound,
            group.potBalance,
            group.currentTurnIndex,
            group.isComplete,
            group.isPrivate,
            group.inviteCode
        );
    }
}
