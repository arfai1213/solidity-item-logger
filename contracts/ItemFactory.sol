//Write your own contracts here. Currently compiles using solc v0.4.15+commit.bbb8e64f.
pragma solidity ^0.5.0;

contract ItemFactory {
  struct Item {
    uint id;
    string name;
    uint[] logKeys;
  }

  struct Log {
    string desc;
    uint created_at;
    address logged_by;
  }

  event ItemAdded(uint indexed id, string name);
  event LogAdded(uint indexed itemId, string desc, uint created_at, address logged_by);

  mapping(uint => Log) logs;
  mapping(uint => Item) items;
  uint[] itemKeys;
  
  uint counter; // for avoiding duplication

  constructor() public {
    counter = 0;
  }

  function _generateUniqueId() private returns (uint id) {
    counter++;
    id = uint(keccak256(abi.encodePacked(counter)));
  }
  
  function _createLog(string memory _name) private returns (uint logId) {
      uint id = _generateUniqueId();
      
      logs[id].desc = _name;
      logs[id].created_at = block.number;
      logs[id].logged_by = msg.sender;
      
      return id;
  }

  function getItems() public view returns (uint[] memory _items){
    return itemKeys;
  }

  function createItem(uint _id, string memory _name) public {
    items[_id].name = _name;
    items[_id].id = _id;
    
    uint logId = _createLog("Record created");
    items[_id].logKeys.push(logId);
    
    itemKeys.push(_id);

    emit ItemAdded(_id, _name);
  }
  
  function addLog(uint itemId, string memory desc) public {
    uint logId = _createLog(desc);
    items[itemId].logKeys.push(logId);
    
    emit LogAdded(itemId, logs[logId].desc, logs[logId].created_at, logs[logId].logged_by);
  }

  function getItemById(uint _id) 
    public 
    view
    returns (string memory name, uint[] memory logKeys) {
    Item memory item = items[_id];
    return (item.name, item.logKeys);
  }
  
  function getLogById(uint _id)
    public
    view 
    returns (string memory desc, uint created_at, address logged_by) {
        Log memory log = logs[_id];
        return (log.desc, log.created_at, log.logged_by);
    }
}