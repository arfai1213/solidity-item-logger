const itemFactory = artifacts.require("ItemFactory");

module.exports = function(deployer) {
  deployer.deploy(itemFactory);
};
