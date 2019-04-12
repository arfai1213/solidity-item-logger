const $itemList = $("#item-list");
const $itemName = $("#item-name");
const $itemTimeline = $("#item-timeline");
const $inputLog = $("input#txt-input-log");
const $inputItemId = $("input#input-item-id");
const $inputItemName = $("input#input-item-name");
const $createItemModal = $("#createItemModal");
let selectedItemId = null;

App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    return App.initWeb3();
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access");
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
    web3 = new Web3(App.web3Provider);
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("ItemFactory.json", function(data) {
      App.contracts.ItemFactory = TruffleContract(data);
      App.contracts.ItemFactory.setProvider(App.web3Provider);

      return Promise.all([App.getAllItems(), App.watchContractEvents()]);
    });

    return App.bindEvents();
  },

  watchContractEvents: async function() {
    const instance = await App.contracts.ItemFactory.deployed();

    instance.ItemAdded().on("data", event => {
      const { id, name } = event.args;
      const el = App.generateItem(id.toNumber(), name);
      $itemList.append(el);
    });

    instance.LogAdded().on("data", event => {
      console.log(event);
      const { itemId, desc, created_at, logged_by } = event.args;
      if (itemId.toNumber() === selectedItemId) {
        const $el = App.generateTimelineItem({ desc, created_at, logged_by });
        $itemTimeline.append($el);
      }
    });
  },

  bindEvents: function() {
    $(document).on("click", "#btn-create-item", App.handleAddItem);
    $(document).on("click", "#btn-add-log", App.addLogToItem);

    $(document).on(
      "click",
      "#item-list .list-group-item",
      App.handleItemSelected
    );
  },

  addLogToItem: async function() {
    web3.eth.getAccounts(async function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      const instance = await App.contracts.ItemFactory.deployed();
      const results = await instance.addLog(selectedItemId, $inputLog.val(), {
        from: account
      });
    });
  },

  getAllItems: async function() {
    web3.eth.getAccounts(async function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      const instance = await App.contracts.ItemFactory.deployed();
      const results = await instance.getItems.call();

      asyncForEach(results, async itemId => {
        const _itemId = itemId.toNumber();
        const { name: itemName } = await instance.getItemById(_itemId);

        const el = App.generateItem(_itemId, itemName);
        $itemList.append(el);
      });
    });
  },

  generateItem: function(itemId, itemName) {
    const el = $('<li class="list-group-item"></li>')
      .html(itemName + `<small class="px-2">#${itemId}</small>`)
      .data("id", itemId)
      .data("name", itemName);

    return el;
  },

  generateTimelineItem: function(log) {
    const $tli = $(`<div class="tl-item">
                      <div class="content">
                        <h6>Block #${log.created_at.toNumber()}</h6>
                        <small class="my-1">By ${log.logged_by}</small>
                        <p class="my-1">${log.desc}</p>
                      </div>
                    </div>`);
    return $tli;
  },

  handleAddItem: async function(event) {
    event.preventDefault();

    web3.eth.getAccounts(async function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      const instance = await App.contracts.ItemFactory.deployed();
      await instance.createItem($inputItemId.val(), $inputItemName.val(), {
        from: account
      });

      $inputItemId.val("");
      $inputItemName.val("");
      $createItemModal.modal("hide");
    });
  },

  handleItemSelected: async function() {
    $(".list-group-item").removeClass("active");
    $(this).addClass("active");

    const itemId = $(this).data("id");

    selectedItemId = itemId;
    const instance = await App.contracts.ItemFactory.deployed();
    const { name, logKeys } = await instance.getItemById(itemId);
    const el = $('<small class="pl-2"></small>').html(`#${itemId}`);
    $itemName.html(name).append(el);

    $itemTimeline.empty();
    asyncForEach(logKeys, async logId => {
      const log = await instance.getLogById(logId);
      const $el = App.generateTimelineItem(log);
      $itemTimeline.append($el);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
