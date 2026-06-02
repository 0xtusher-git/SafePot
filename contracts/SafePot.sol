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

        // Check if round is complete (all members contributed)
        if (group.members.length == group.maxMembers) {
            bool roundComplete = true;
            for (uint i = 0; i < group.members.length; i++) {
                if (memberContributions[groupId][group.members[i]] < group.currentRound) {
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
        
        address winner = group.members[group.currentTurnIndex];
        uint256 amount = group.potBalance;
        group.potBalance = 0;
        
        require(usdcToken.transfer(winner, amount), "Transfer to winner failed");
        emit PotDistributed(groupId, winner, amount);
        
        group.currentTurnIndex++;
        if (group.currentTurnIndex >= group.members.length) {
            // Cycle complete
            group.isComplete = true;
        } else {
            group.currentRound++;
        }
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
