const $itemTimeline = $("#item-timeline");
const $inputItemId = $("#input-item-id");
const $itemName = $("#item-name");
const $modal = $("#modal");

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
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on("click", "#btn-explore", App.getItemDetails);
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

  getItemDetails: async function() {
    const itemId = $inputItemId.val();

    selectedItemId = itemId;
    const instance = await App.contracts.ItemFactory.deployed();
    const { name, logKeys } = await instance.getItemById(itemId);

    if (logKeys.length === 0) {
      alert("Item not available");
      return;
    }

    const el = $('<small class="pl-2"></small>').html(`#${itemId}`);
    $itemName.html(name).append(el);

    $itemTimeline.empty();
    asyncForEach(logKeys, async logId => {
      const log = await instance.getLogById(logId);
      const $el = App.generateTimelineItem(log);
      $itemTimeline.append($el);
    });

    $modal.modal("show");
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
