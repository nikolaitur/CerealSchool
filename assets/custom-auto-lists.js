/**
 * Rebase Auto Lists custom implementation
 * @summary A custom reworking of auto-lists code to use with the Rebase theme.
 * @date 11/29/2017
 * @copyright (c) 2017, Rehash
 */

// Update: 9/28/18 - triggerVariantChange looks for checked radio or checkbox
// NOTE: added event namespace and unbinding so this can work with quick look

REBASE.theme.customBindListsEvents = function ($) {
	// NOTE: Everything must be inside jQuery ready to ensure this code executes last (after all the theme.js page modifications)
	// The inconsistency of script load order between themes and some themes loading jquery with defer make this necessary
	$(function () {

		var REBASE = window.REBASE,
			option_control_selector,
			current_product_id,
			product_json,
			no_options_controls,
			single_variant_id,
			single_variant_available,
			triggerVariantChange = function () { /* no-op until defined */ },
			// NOTE: updating some custom classes on buttons so that CSS can be used to control logic like showing or hiding notify button automatically
			updateButtonClasses = function (product_id, variant_available) {
				var AVAILABLE_CLASS = 'lists-variant-available';

				if (variant_available) {
					$('[data-rebase-lists-wishlist-add-remove="' + product_id + '"]').addClass(AVAILABLE_CLASS);
					$('[data-rebase-lists-notify-add-remove="' + product_id + '"]').addClass(AVAILABLE_CLASS);
				} else {
					$('[data-rebase-lists-wishlist-add-remove="' + product_id + '"]').removeClass(AVAILABLE_CLASS);
					$('[data-rebase-lists-notify-add-remove="' + product_id + '"]').removeClass(AVAILABLE_CLASS);
				}
			};


		/* CSS logic to show/hide buttons (can easily be overridden with css, gives developers the option to avoid writing custom javascript)
		======================================== */
		// NOTE: adding custom button classes for styling / logic
		$('[data-rebase-lists-wishlist-add-remove]').addClass('lists-wishlist-btn');
		$('[data-rebase-lists-notify-add-remove]').addClass('lists-notify-btn');

		// NOTE: these values come from the button builder / installer in the Rebase admin
		if (REBASE.SRAM && REBASE.SRAM.auto_lists && REBASE.SRAM.auto_lists.notify_display_logic) {
			switch (REBASE.SRAM.auto_lists.notify_display_logic) {
				case 'swap-wishlist':
					$('head').append('<style type="text/css">.lists-notify-btn, .lists-wishlist-btn.lists-variant-available {display:block;} .lists-wishlist-btn, .lists-notify-btn.lists-variant-available {display:none;}</style>');
					break;
				case 'auto-show':
					$('head').append('<style type="text/css">.lists-notify-btn, .lists-wishlist-btn {display:block;} .lists-notify-btn.lists-variant-available {display:none;}</style>');
					break;
				default:
					// always show both
					$('head').append('<style type="text/css">.lists-notify-btn, .lists-wishlist-btn {display:block;}</style>');
			}
		} else {
			// always show both
			$('head').append('<style type="text/css">.lists-notify-btn, .lists-wishlist-btn {display:block;}</style>');
		}

		/* Rebase theme
		======================================== */
		option_control_selector = '.single-option-select';

		// NOTE: Product id is not available from the variantChange event, so we try to grab it from json data on page load
		// NOTE: These themes are setup to not output any variant controls (if there's only one variant and
		// the default title is used) so we have to handle them differently. We get that data here too.
		product_json = $('#product__json');

		if (product_json.length) {
			product_json = JSON.parse(product_json.html());
		} else {
			product_json = null;
		}

		if (product_json && product_json.id) {
			current_product_id = product_json.id;

			if (product_json.variants && product_json.variants.length === 1) {
				single_variant_id = product_json.variants[0].id;
				single_variant_available = product_json.variants[0].available;

				if (product_json.options && product_json.options.length === 1) {
					no_options_controls = true;
				}
			}
		}
		product_json = null; // NOTE: don't need to keep that data in memory

		triggerVariantChange = function () {
			var input_type;

			if (no_options_controls) {
				// manually trigger a fake event
				$('body').trigger({
					type: 'variantChange',
					variant: {
						id: single_variant_id,
						available: single_variant_available
					}
				});
			} else {
				input_type = $(option_control_selector).first().attr('type');

				if (input_type === 'radio' || input_type === 'checkbox') {
					$(option_control_selector).filter(':checked:first').trigger('change');
				} else {
					$(option_control_selector).first().trigger('change');
				}
			}
		};


		$('body').off('variantChange.custAutoLists').on('variantChange.custAutoLists', function (e) {
			var variant_id = e.variant ? e.variant.id : 'invalid';

			if (current_product_id) {

				// Update variant for lists
				REBASE.lists.updateActiveProductVariant({
					product_id: current_product_id,
					variant_id: variant_id,
					quantity: $('input[name="quantity"]').val() || 1
				});

				// Update variant for extra form data
				if (REBASE.forms && REBASE.forms.updateActiveVariant) {
					REBASE.forms.updateActiveVariant(variant_id);
				}

				updateButtonClasses(current_product_id, e.variant && e.variant.available);
			}
		});

		// Update variant when quantity changes
		$('input[name="quantity"]').off('change.custAutoLists').on('change.custAutoLists', triggerVariantChange);

		// Trigger change on page load
		triggerVariantChange();
	});
};


// NOTE: Waiting for DOMContentLoaded event in case defer was used to load a library (like jquery)
document.addEventListener('DOMContentLoaded', function () {
	/* init
	======================================== */
	if (typeof window.jQuery === 'undefined') {
		console.warn('Rebase theme custom auto-lists: jQuery is missing');
	} else {
		REBASE.theme.customBindListsEvents(window.jQuery);
	}
});
