window.REBASE = window.REBASE || {};
REBASE.theme = REBASE.theme || {};

(function() {
  function onDOMLoaded() {
    var currentSelectedFlavors;
    var defaultBundleInput = $('.product-option--bundle.product-option--selected input');
    // var defaultFlavors = [];

// alert('hi');
    product = new REBASE.theme.Product({
      $container: $('#add-to-cart-form')
    });

    // Create an initial interaction to sync up on page load
    if ( product.currentVariant ) {
      currentSelectedFlavors = product.currentVariant.option1.split('+');

      $('.product-option').removeClass('product-option--selected');

      // initial click to set our current bundle
      $('.product-option--bundle input[value="'+ product.currentVariant.option3 +'"]').click();

      // series of clicks to set our current flavors
      currentSelectedFlavors.forEach(function(flavor) {
        $('.product-option--flavor input[value="'+ flavor.trim() +'"]').click();
      });
    } else {
      // defaultFlavors = product.variantDefaults[defaultBundleInput.val()].split('|');

      defaultBundleInput.click();
      // defaultFlavors.forEach(function(df) {
      //   $('.product-option--flavor input[value="'+ df +'"]').click()
      // });
    }

    if ($('.sold-in-number') && $('#add-to-cart-form')) {
      var productId = $('#add-to-cart-form').data('productid');
      var soldInNum = localStorage.getItem(productId+'SoldIn');
      if (!soldInNum) {
        soldInNum = Math.floor(Math.random() * (220 - 150 + 1) + 150);
        localStorage.setItem(productId+'SoldIn', soldInNum);
      }
      $('.sold-in-number').html(soldInNum);
    }
  }

  document.addEventListener('DOMContentLoaded', onDOMLoaded);
})();


/* ----------------------------------------------------------------
-------------------------------------------------------------------
Product class
-------------------------------------------------------------------
-----------------------------------------------------------------*/

REBASE.theme.Product = (function() {
  function Product(options) {
    this.variants = null;
    this.$container = options.$container;
    this.data = JSON.parse(document.getElementById('product__json').innerHTML);
    this.currentVariant = JSON.parse(document.getElementById('current_variant__json').innerHTML);
    this.variantDefaults = JSON.parse(document.getElementById('variant__defaults').innerHTML);
    this.variantPerBagPrices = JSON.parse(document.getElementById('variant_per_bag').innerHTML);

    this.settings = {
      single_option_selector: '.single-option-select',
      original_select_id: 'select#product-select'
    };

    if (this.data) {
      this._initVariants();
    } else {
      if (console) {console.log('Missing product json data!');}
    }
  }

  Product.prototype = $.extend({}, Product.prototype, {
    _initVariants: function() {
      var options = {
        $container: this.$container,
        enable_history_state: true,
        single_option_selector: this.settings.single_option_selector,
        original_select_id: this.settings.original_select_id,
        product: this.data
      };

      this.variants = new REBASE.theme.Variants(options);

      this.$container.on('variantChange', this._updateAddToCart.bind(this));
      this.$container.on('variantChange', this._updatePrices.bind(this));
      this.$container.on('optionChange', this._updateSelectedOption.bind(this));
    },

    _setSlashPrice: function(variant) {
      var one_time_slash_price = variant.compare_at_price || '',
        subscription_slash_price = variant.compare_at_price || '',
        formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        
          // These options are needed to round to whole numbers if that's what you want.
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

      if (variant.price == variant.compare_at_price) {
        one_time_slash_price = '';        
      }
      if (0 !== one_time_slash_price.length) {
        one_time_slash_price = formatter.format(one_time_slash_price * .01)
      }
      if (0 !== subscription_slash_price.length) {
        subscription_slash_price = formatter.format(subscription_slash_price * .01)
      }
      // console.log(variant);
      // switch(bundle_type) {
      //   case 'bundle':
      //   case 'single':
      //     one_time_slash_price = '$59.98',
      //     subscription_slash_price = '$59.98';
      //     break;
      //   case 'variety':
      //     one_time_slash_price = '$119.99',
      //     subscription_slash_price = '$119.99';
      //     break;
      //   case 'single-sm':
      //     one_time_slash_price = '',
      //     subscription_slash_price = '$29.99';
      //     break;
      // }

      $('#slash_price_one_time').text(one_time_slash_price)
      $('#slash_price_subscription').text(subscription_slash_price)
    },

    _setPerBagPrices: function(id) {
      var prices = this.variantPerBagPrices[id];
      $('.per-bag--once').html(prices.once);
      $('.per-bag--subs').html(prices.subs);
    },

    _getSelectedBundleLimit: function() {
      return $('.product-option--bundle.product-option--selected input').data('flavor-limit');
    },

    _getSelectedFlavorCount: function() {
      return $('.product-option--flavor.product-option--selected').length;
    },

    _setFlavorsForBundle: function(type) {
      $('.product-option--flavor').removeClass('product-option--selected');
      defaultFlavors = this.variantDefaults[type].split('|');
      defaultFlavors.forEach(function(df) {
        $('.product-option--flavor input[value="'+ df +'"]').click()
      });
    },

    _getDisabledButtonLabel: function(count) {
      switch(count) {
        case 1:
          return 'Select 2nd Flavor';
        case 2:
          return 'Select 3rd Flavor';
        case 3:
          return 'Select 4th Flavor';
      }
    },

    _updateBundleOption: function(value) {
      $('.product-option--bundle').removeClass('product-option--selected');
      $('.product-option--bundle'+' input[value="'+value+'"]').parents('.product-option').addClass('product-option--selected');
    },

    _updateFlavorOption: function(value) {
      var limit = this._getSelectedBundleLimit(),
        count = this._getSelectedFlavorCount();

      if ( count < limit ) {
        $('.product-option--flavor input[value="'+value+'"]').parents('.product-option').addClass('product-option--selected');
      }

      if ( count >= limit ) {
        $('.product-option--flavor').removeClass('product-option--selected');
        $('.product-option--flavor input[value="'+value+'"]').parents('.product-option').addClass('product-option--selected');
      }
    },

    _updateSelectedOption: function(e) {
      var type = e.target.dataset.type,
        value = e.target.value;

      if ( type == 'bundle' ) {
        this._updateBundleOption(value);
        this._setFlavorsForBundle(value)
      } else if ( type == 'flavor' ) {
        this._updateFlavorOption(value);
      }
    },

    _updatePrices: function(e) {
      if (!e.variant) {return};
      this._setSlashPrice(e.variant);
      this._setPerBagPrices(e.variant.id);
    },

    _updateAddToCart: function(e) {
      var btn = $('#add-to-cart'),
        btnText = $('#add-to-cart-text'),
        limit = this._getSelectedBundleLimit(),
        selectedCount = this._getSelectedFlavorCount(),
        buttonLabel = btnText.data('add-to-cart-text');

      if ( !e.variant || limit > selectedCount ) {
        buttonLabel = this._getDisabledButtonLabel(selectedCount);
        btn.addClass('disabled');

        if ( $('.product-option--flavor.product-option--selected').length <=0 ) {
          buttonLabel = 'Sold Out'
        }
      } else {
        btn.removeClass('disabled');
      }

      btnText.text(buttonLabel);
    }
  });

  return Product;
})();

/* ----------------------------------------------------------------
-------------------------------------------------------------------
Product Variants class - based on Shopify debut
-------------------------------------------------------------------
-----------------------------------------------------------------*/

REBASE.theme.Variants = (function() {
  function Variants(options) {
    this.$container = options.$container;
    this.product = options.product;
    this.single_option_selector = options.single_option_selector;
    this.original_select_id = options.original_select_id;
    this.enable_history_state = options.enable_history_state;
    this.variantFlavorLimits = JSON.parse(document.getElementById('variant__flavor_limits').innerHTML);
    this.current_variant = {};

    $(this.single_option_selector, this.$container).on('click', this._onOptionChange.bind(this));
  }

  Variants.prototype = $.extend({}, Variants.prototype, {
    /**
     * Get the currently selected options from add-to-cart form.
     *
     * @return {object} options - key/value pair of name and value
     */
    _getCurrentSelections: function() {
      var options = [];

      options = $.map($(this.single_option_selector, this.$container), function(el) {
        var $el = $(el),
          current_option = {};

        if ( $el.parents('.product-option--selected').length ) {
          current_option.value = el.value;
          current_option.type = el.dataset.type;
          return current_option;
        } else {
          return false
        }
      });

      return options.filter(Boolean);
    },

    /**
     * Find variant based on selected values.
     *
     * @param  {array} selected_values - Values of variant inputs
     * @return {object || undefined} found - Variant object from product.variants
     */
    _getVariantFromOptions: function() {
      var selected_values = this._getCurrentOptions(),
        variants = this.product.variants,
        found;

      found = $.grep(variants, function(variant) {
        return selected_values.every(function(values) {
          return variant[values.index] === values.value;
        });
      });

      if (found.length) {
        found = found[0];
      } else {
        found = undefined;
      }

      return {
        variant_match: found,
      };
    },

    _getSelectedBundle: function() {
      return $('input[name="single-option-select-bundle"]:checked').val();
    },

    _getFlavorLimit: function(value) {
      return this.variantFlavorLimits[value];
    },

    _getSelectedVariant: function() {
      var currentSelections = this._getCurrentSelections(),
        variants = [], variant = null,
        validSelection = false,
        bundleOption = currentSelections.filter(function(cs) {return cs.type === 'bundle';})[0],
        flavorOptions = currentSelections.filter(function(cs) {return cs.type === 'flavor'});

      // if we don't have enough flavors selected, flag so we can bail early
      switch( bundleOption.value ) {
        case 'variety':
          // Handle the case where there are less than 4 flavors
          var varietyOptionsLength = Math.min($('.product-options--flavors .product-option').length, this._getFlavorLimit(bundleOption.value));
          validSelection = flavorOptions.length === varietyOptionsLength;
          break;
        case 'bundle':
        case 'single':
        case 'single-sm':
          validSelection = flavorOptions.length === this._getFlavorLimit(bundleOption.value);
          break;
      }

      if ( validSelection ) {

        // filter by bundle
        variants = this.product.variants.filter(function(variant){
          return variant.option3 === bundleOption.value;
        });

        // filter by flavors
        variants = variants.filter(function(variant) {
          var valid = true;

          flavorOptions.forEach(function(flavorOption) {
            if ( !variant.option1.includes(flavorOption.value) ) {
              valid = false;
            }
          });

          return valid;
        });

        if ( variants.length > 0 ) {
          variant = variants[0];
        }
      }

      return variant;
    },

    /**
     * Event handler for when a variant input changes.
     */
    _onOptionChange: function(e) {
      var variant = null,
        selected_bundle = this._getSelectedBundle();

      this.$container.trigger({
        type: 'optionChange',
        target: e.target,
        selected_bundle: selected_bundle
      });

      variant = this._getSelectedVariant();

      this._variantChange(variant);

      if (!variant) {
        this.current_variant = {};
        return;
      }

      this._updateMasterSelect(variant);
      this._updatePrice(variant);
      this.current_variant = variant;

      if (this.enable_history_state) {
        this._updateHistoryState(variant);
      }
    },

    _variantChange: function(variant) {
      this.$container.trigger({
        type: 'variantChange',
        variant: variant,
      });
    },

    /**
     * Trigger event when variant price changes.
     *
     * @param  {object} variant - Currently selected variant
     * @return {event} variantPriceChange
     */
    _updatePrice: function(variant) {
      if (variant.price === this.current_variant.price && variant.compare_at_price === this.current_variant.compare_at_price) {return;}

      this.$container.trigger({
        type: 'variantPriceChange',
        variant: variant
      });
    },

    /**
     * Update history state for product deeplinking
     *
     * @param  {variant} variant - Currently selected variant
     * @return {k}         [description]
     */
    _updateHistoryState: function(variant) {
      if (!history.replaceState || !variant) {return;}
      var urlParams = new URLSearchParams(window.location.search);
      urlParams.set('variant', variant.id);
      var newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?' + urlParams.toString();
      window.history.replaceState({ path: newurl }, '', newurl);
    },

    /**
     * Update hidden master select of variant change
     *
     * @param  {variant} variant - Currently selected variant
     */
    _updateMasterSelect: function(variant) {
      $(this.original_select_id, this.$container).val(variant.id);
    }
  });

  return Variants;
})();
