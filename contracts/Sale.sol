pragma solidity 0.4.8;

contract Sale {

    event PurchasedToken(address indexed purchaser, uint amount);

    mapping(address => uint) public purchaseRecords;
    address public owner;
    address public wallet;
    uint public price;
    uint public tokensRemaining;

    //TODO: Add changePrice function
    modifier onlyOwner {
        if(msg.sender != owner) { throw; }
        _;
    }

    function Sale(address _owner,
                  address _wallet,
                  uint _price,
                  uint _tokensToSell) {
        owner = _owner;
        wallet = _wallet;
        price = _price;
        tokensRemaining = _tokensToSell;
    }

    function purchaseToken(uint _amount) payable {
        if(!(msg.value > 0)) { throw; }
        if(_amount > tokensRemaining) { throw; }
        if(msg.value != (price * _amount)) { throw; }

        purchaseRecords[msg.sender] += _amount;
        tokensRemaining -= _amount;
        
        if(!wallet.send(msg.value)) { throw; }

        PurchasedToken(msg.sender, _amount);
    }

    function changeOwner(address _newOwner) onlyOwner {
        owner = _newOwner;
    }
}
