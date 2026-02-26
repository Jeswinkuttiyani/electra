// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Election {
    struct Candidate {
        uint id;
        string name;
        string position;
        string symbol;
        uint voteCount;
        bool exists;
    }

    address public admin;
    bool public votingOpen;
    uint public candidateCount;
    uint public totalVotes;

    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public hasVoted;

    event VoteCast(address indexed voter, uint indexed candidateId, uint timestamp);
    event CandidateAdded(uint indexed candidateId, string name, string position);
    event VotingStarted(uint timestamp);
    event VotingEnded(uint timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier votingIsOpen() {
        require(votingOpen, "Voting is not open");
        _;
    }

    modifier votingIsClosed() {
        require(!votingOpen, "Voting must be closed");
        _;
    }

    constructor() {
        admin = msg.sender;
        votingOpen = false;
        candidateCount = 0;
        totalVotes = 0;
    }

    function addCandidate(
        string memory _name,
        string memory _position,
        string memory _symbol
    ) public onlyAdmin votingIsClosed {
        candidateCount++;
        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            position: _position,
            symbol: _symbol,
            voteCount: 0,
            exists: true
        });
        emit CandidateAdded(candidateCount, _name, _position);
    }

    function startVoting() public onlyAdmin votingIsClosed {
        require(candidateCount > 0, "Add at least one candidate before starting");
        votingOpen = true;
        emit VotingStarted(block.timestamp);
    }

    function endVoting() public onlyAdmin votingIsOpen {
        votingOpen = false;
        emit VotingEnded(block.timestamp);
    }

    function castVote(uint _candidateId) public votingIsOpen {
        require(!hasVoted[msg.sender], "You have already voted");
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate");
        require(candidates[_candidateId].exists, "Candidate does not exist");

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        totalVotes++;

        emit VoteCast(msg.sender, _candidateId, block.timestamp);
    }

    function getCandidate(uint _id) public view returns (
        uint id,
        string memory name,
        string memory position,
        string memory symbol,
        uint voteCount
    ) {
        require(_id > 0 && _id <= candidateCount, "Invalid candidate ID");
        Candidate memory c = candidates[_id];
        return (c.id, c.name, c.position, c.symbol, c.voteCount);
    }

    function getStatus() public view returns (
        bool _votingOpen,
        uint _candidateCount,
        uint _totalVotes
    ) {
        return (votingOpen, candidateCount, totalVotes);
    }
}
