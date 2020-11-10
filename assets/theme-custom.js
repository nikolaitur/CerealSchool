window.REBASE = window.REBASE || {};
REBASE.theme = REBASE.theme || {};

(function($) {
  /* ----------------------------------------------------------------
  -------------------------------------------------------------------
  Main Script
  -------------------------------------------------------------------
  -----------------------------------------------------------------*/

  $(function() {
    /* ----------------------------------------------------------------
    Initializations
    -----------------------------------------------------------------*/

    /* ----------------------------------------------------------------
    Navigation
    -----------------------------------------------------------------*/
    // Mobile Navigation
    var mmStatus = 'closed';

    function closeMM() {
      mmStatus = 'closed';
      $('#mobile-navigation-toggle').removeClass('opened');
      $('body').removeClass('nav-opened');
    }

    function openMM() {
      mmStatus = 'opened', _body = $('body');
      _body.removeClass('search-opened');
      _body.addClass('nav-opened');
      $('#mobile-navigation-toggle').addClass('opened');
      if ( _body.hasClass('mini-cart-open') ) { $('.minicart-toggle-btn').trigger('click') }
    }

    $('#mobile-navigation-toggle, .mobile-navigation-close').on('click', function() {
      if (mmStatus == 'closed') {
        openMM();
      } else if (mmStatus == 'opened') {
        closeMM();
      }
      return false;
    });

    $('.mobile-navigation-item__toggle').on('click', function(e) {
      e.preventDefault();
      $(this).closest('li').toggleClass('open');
      // $(this).toggleClass('opened').next().toggle();
    });

    $(document).on('click', '.mobile-navigation-header-item', function(e) {
      var _this = $(this);

      $('.mobile-navigation-header-item').removeClass('mobile-navigation-header-item--selected');
      _this.addClass('mobile-navigation-header-item--selected');

      $('.mobile-navigation-item').removeClass('mobile-navigation-item--selected');
      $('.mobile-navigation-item--' + _this.data('link-handle')).addClass('mobile-navigation-item--selected');
    });

    // JS for closing minicart with swipe to right
    $(document).on('touchstart', '.minicart.minicart--visible', function(e) {
      touchstartX = e.changedTouches[0].screenX;
    });

    $(document).on('touchend', '.minicart.minicart--visible', function(e) {
      touchendX = event.changedTouches[0].screenX;
      if ( touchendX - touchstartX > 100 ) {
        $('.minicart__header span').trigger('click')
      }
    });

    function getCookie(name){
      return( document.cookie.match('(^|; )'+name+'=([^;]*)')||0 )[2]
    }
    // 12 bag upgrade modal

    function findCurrentVariant(variantId) {
      return meta.product.variants.filter(function(item) { return item.id.toString() === variantId })[0];
    }

    function shouldShowUpgradeModal(variantId) {
      var currentVariant = findCurrentVariant(variantId);
      return currentVariant.name.split(' / ').includes('12 Bags') && $('.rc_block__type__onetime').hasClass('rc_block__type--active');
    }


    function shouldAddFreeGift() {
      if (typeof(promoProduct) === 'undefined') {
        return false;
      }
      // console.log(promoProduct.variants[0].sku);
      var free_gift_item = CartJS.cart.items.filter(function(item) { 
        return ( item.sku === promoProduct.variants[0].sku);
      });

      return $('.product-option-row--free-gift input').is(':checked') && free_gift_item.length === 0;
    }

    function shouldAddThresholdGift(variantId) {
      // promoEnabled set in cart-drawer
      var thresholdGiftCookieName = 'sys_recharge_freegift_gauge';
      if (typeof(promoEnabled) === 'undefined' || typeof(promoAmount) === 'undefined' || !getCookie(thresholdGiftCookieName)) {
        return false;
      }

      var product = meta.product.variants.filter(function(item) {return item.id.toString() === variantId})[0]
      return promoEnabled && CartJS.cart.total_price + product.price >= promoAmount && $('.rc_radio:checked').val() == "onetime";
    }

    function addThresholdGift() {
      if (typeof(promoProduct) === 'undefined') {
        return;
      }
      var cartDoesNotHaveUpsellGift = CartJS.cart.items.filter(function(item) { return item.id == promoProduct.variants[0].id }).length == 0
      var cartHasNoSubscriptions = CartJS.cart.items.filter(function(item) { return item.properties.hasOwnProperty("subscription_id"); }).length == 0;
      if (cartDoesNotHaveUpsellGift && cartHasNoSubscriptions) {
        CartJS.addItem(promoProduct.variants[0].id, 1, {}, {
          "success": function(data, textStatus, jqXHR) {
              console.log('Added!');
          },
          "error": function(jqXHR, textStatus, errorThrown) {
              console.log('Error: ' + errorThrown + '!');
          }
        });
      }
    }
    
    function showUpgradeModal(variantId) {
      // TODO make this configurable
      var modalHTML = '<div id="12bag-upgrade-modal" class="modal" data-variant-id="'+ variantId +'"><h1>Upgrade to 24 Bags and Save 20%</h1><p>82% of customers have taken advantage of this deal.</p><a href="#" class="btn btn--block" id="modal-upgrade-button">Upgrade!</a><a class="btn btn--block" href="#" id="modal-close-button" rel="modal:close">No Thanks</a><a class="" href="#" id="modal-close-button-x" rel="modal:close">×</a></div>';
      if ($('body #12bag-upgrade-modal').length === 0) {
        $('body').append(modalHTML);
      } else {
        $('body #12bag-upgrade-modal').replaceWith(modalHTML);
      }
      // pop model,
      $('#12bag-upgrade-modal').on($.modal.BEFORE_OPEN, function(event, modal) {
        $('.modal-wrapper').show();
        $('#12bag-upgrade-modal').addClass('grid');
      });
      $('#12bag-upgrade-modal').modal({
        blockerClass: "upgrade-modal modal-wrapper",
        escapeClose: false,
        clickClose: false,
        showClose: false
      });
      // handle upgrade button
      $('#12bag-upgrade-modal #modal-upgrade-button').on('click', function() {
        // find this product
        var variantId = $("#12bag-upgrade-modal").data('variant-id');
        var currentVariant = meta.product.variants.filter(function(item) { return item.id === variantId })[0];
        var currentVariantNameItems = currentVariant.name.split('/');
        currentVariantNameItems.pop();

        // upgraded variant
        var upgradedVariant = meta.product.variants.filter(function(item) { return item.name.includes(currentVariantNameItems.join('/').replace('12 Bags', '24 Bags')) })[0];
        CartJS.removeItemById(variantId);
        CartJS.addItem(upgradedVariant.id, 1, {}, {
          "success": function(data, textStatus, jqXHR) {
              console.log('Added!');
          },
          "error": function(jqXHR, textStatus, errorThrown) {
              console.log('Error: ' + errorThrown + '!');
          }
        });
        $.modal.close();
      });
    }

    $(document).on('click', "#add-to-cart", function() { 
      var urlParams = new URLSearchParams(window.location.search);
      var variantId = urlParams.get('variant');
      if (shouldShowUpgradeModal(variantId)) {
        showUpgradeModal(variantId);
      }
      if (!shouldAddFreeGift() && shouldAddThresholdGift(variantId)) {
        console.log('threshold gift');
        addThresholdGift();
      }
      if (shouldAddFreeGift()) {
        console.log('adding gift with id ' + promoProduct.variants[0].id);

        CartJS.addItem(promoProduct.variants[0].id, 1, {free_gift: true}, {
          "success": function(data, textStatus, jqXHR) {
            console.log('Added!');
          },
          "error": function(jqXHR, textStatus, errorThrown) {
              console.log('Error: ' + errorThrown + '!');
          }
        });
      }
        
    });
    /* ----------------------------------------------------------------
    jQuery toggles
    -----------------------------------------------------------------*/

    //Login Page - forgot password toggle
    $('#forgot-password').on('click', function() {
      $('#recover-password-form').show();
      $('#customer-login-form').hide();
    });

    $('#forgot-password-cancel').on('click', function() {
      $('#recover-password-form').hide();
      $('#customer-login-form').show();
    });
  });
})(jQuery);
