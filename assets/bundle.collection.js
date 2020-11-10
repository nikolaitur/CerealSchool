window.REBASE = window.REBASE || {};
REBASE.theme = REBASE.theme || {};
REBASE.theme.collection = {};

(function($) {
  $(function() {
    REBASE.theme.collection.tags = [];

    // back to top link
    $('.back-to-top').on('click', function(e) {
      e.preventDefault();
      $('html, body').animate({ scrollTop: $('body').offset().top }, 500);
    });

    getFilteredCollectionHTML = function(page) {
      var main_container = $('.collection-main'),
        url, pageParam = page ? '&page='+page : '';

      main_container.addClass('collection-main--loading');
      $('html, body').animate({ scrollTop: main_container.offset().top - 170 }, 500);

      if ( window.location.search ) {
        url = window.location + '&view=ajax' + pageParam
      } else {
        url = window.location.pathname + '?view=ajax' + pageParam
      }

      $.ajax(url, {
        method: 'GET',
        success: function(data){
          main_container.replaceWith(data);
          main_container.removeClass('collection-main--loading');
        }
      });
    }

    function updateSelectedTags(page) {
      REBASE.theme.collection.tags = [];
      var sortParam = '', url = '', pageParam = '';

      $('.filtering-list-item--selected').each(function(i, v) {
        var val = $(v).data('value'), split_val = val.split(':');

        if ( split_val[0] === 'sort_by' ) {
          sortParam = '?sort_by=' + split_val[1];
          return;
        }

        REBASE.theme.collection.tags.push($(v).data('value'))
      });

      if ( page ) {
        pageParam = sortParam ? '&page='+page : '?page='+page
      }

      url = REBASE.theme.collection.url + '/' + REBASE.theme.collection.tags.join('+') + sortParam + pageParam;
      history.replaceState({}, '', url)
      getFilteredCollectionHTML(page);
    }

    function updateFilterGroupLabels() {
      $('.filtering-list-item--selected').each( function() {
        var _this = $(this);
        _this.parents('.filtering-group').find('.filtering-group__title span').text(_this.data('label'))
      })
    }

    $(document).on('click', '.pagination__part--link a, .pagination__part--next, .pagination__part--prev', function(e) {
      e.preventDefault();

      updateSelectedTags($(this).data('page'))
    });

    $(document).on('click', '.product__swatch', function(e) {
      e.preventDefault();
      var swatch = $(this),
        data = swatch.data(),
        product_el = swatch.parents('.product');

      swatch.siblings().removeClass('product__swatch--selected');
      swatch.addClass('product__swatch--selected');


      if ( data.variantImage !== '' ) {
        product_el.find('.product__image--primary').attr('src', data.variantImage ).attr('data-src', data.variantImage );
      }
      if ( data.variantImageSecondary !== '' ) {
        product_el.find('.product__image--secondary').attr('src', data.variantImageSecondary ).attr('data-src', data.variantImageSecondary );
      }

      product_el.find('.product__price--current').text(data.variantPrice);
      product_el.find('.product__price--old').text(data.variantCompareAtPrice);
      product_el.toggleClass('product--on-sale', data.onSale)

      if ( data.variantUrl !== '' ) {
        product_el.find('.product__content a').attr('href', data.variantUrl);
      }
    });

    $('.product').each(function() {
      $(this).find('.product__swatch').first().trigger('click');
    });


    // toggle mobile filter drawer
    $(document).on('click', '.collection-header__filtering-toggle, .filtering-group--apply', function(e) {
      $('.collection-header__filtering-toggle').toggleClass('collection-header__filtering-toggle--open');
      $('.collection-filters').slideToggle();
    });

    // close filters if click anywhere outside of filter groups
    $(document).on('click', function(e) {
      var container = $('.filtering-group');

      // if we click outside of our filter, close filters
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        $('.filtering-list').removeClass('filtering-list--open');
      }
    });

    // hide/show filter dropdowns
    $(document).on('click', '.filtering-group:not(.filtering-group--clear) .filtering-group__title', function(e) {
      var _this = $(this);

      _this.parents('.widget--filtering').find('.filtering-list').removeClass('filtering-list--open')
      _this.parents('.filtering-group').find('.filtering-list').addClass('filtering-list--open')
    });

    // take action when selecting a filter
    $(document).on('click', '.filtering-list-item', function(e) {
      e.preventDefault();
      var _this = $(this),
        group_el = _this.parents('.filtering-group');

      // bail if we're disabled
      if (_this.hasClass('disabled')) {
        return false;
      }

      //show the clear button
      $('.filtering-group--clear').show();

      // update the filter UI
      group_el.find('.filtering-list-item').removeClass('filtering-list-item--selected');
      _this.addClass('filtering-list-item--selected');

      updateFilterGroupLabels();

      setTimeout(function(){
        group_el.find('.filtering-list').removeClass('filtering-list--open')
      }, 150);

      updateSelectedTags();
    });

    // take an action when clearing filters
    $(document).on('click', '.filtering-group--clear', function() {
      $(this).hide();
      $('.filtering-list-item').removeClass('filtering-list-item--selected');
      $('.filtering-list').removeClass('filtering-list--open');
      $('.filtering-group__title span').each(function(i, v) {
        var _this = $(v);
        _this.text(_this.parent().data('original-text'));
      })
      updateSelectedTags();
    });

    updateFilterGroupLabels();
  });
})(jQuery);
