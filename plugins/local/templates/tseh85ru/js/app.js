var app = app || {};

(function() {


	app.cart = (function() {

		var $widget = $('.cart'),
			active = 'cart_opened',
			s = {
				_quantityRequestDelay : false,
				_quantityRequestTimeout : 1000,
				_updateDelay: false
			};


		var init = function() {

			$widget.on('click', '.cart__icon', _toggle);
			$(document).on('click', '.i-to-cart', _toCart);
			$(document).on('click', '.cart__remove', _toCart);

			$(document).on('focus', '.cart__quantity-field', _focusQuantity);
			$(document).on('blur', '.cart__quantity-field', _blurQuantity);
			$(document).on('keypress', '.cart__quantity-field', _timeoutQuantity);
		};


		var _toggle = function(e) {

			e.stopPropagation();
			$widget.hasClass(active) && _close(e) || _open(e);
		};	


		var _open = function(e) {

			$widget.addClass(active);
			$(document).on('click', _avoidClick);
		};


		var _close = function() {

			$widget.removeClass(active);
			return true;
			$(document).off('click', _avoidClick);
		};


		var _avoidClick = function(e) {

			if ($(this).is('.cart__icon') || !$(e.target).closest($widget).length)
				_close();
		};	


		var _toCart = function(e) {

			e.preventDefault();
			e.stopPropagation();

			var $this = $(this);

			_update($this.attr('href'));
		};


		var _update = function(url) {

			app.request.process({
				url: url,
				type: 'html'
			}, function(response) {

				if (response.length)
					$widget.html(response);

				if (s._updateDelay)
					clearTimeout(s._updateDelay);

				setTimeout(function() {
					$widget.find('.cart__icon').addClass('cart__icon_up');
				}, 10);

				setTimeout(function() {

					$widget.find('.cart__icon').removeClass('cart__icon_up');
				}, 1000);
			});
		};


		var _focusQuantity = function(e) {

			var $this = $(this);

			$this.data('value', $this.val());
			$this.val('');
		};

		var _blurQuantity = function(e) {

			var $this = $(this);

			//если пусто
			if ($this.val().length < 1 || !($this.val() > -1))
				$this.val($this.data('value'));

			if ($this.val() !== $this.data('value'))
				_updateQuantity($this);
		};


		var _updateQuantity = function($field) {

			_update($field.data('update') + $field.val());
		};


		var _timeoutQuantity = function(e) {

			if (s._quantityRequestDelay)
				clearTimeout(s._quantityRequestDelay);

			var $field = $(this);

			s._quantityRequestDelay = setTimeout(function() {

				$field.trigger('blur');
			}, s._quantityRequestTimeout);
		};


		init();

		return {
			refresh: function() {

				_update($widget.data('update'));
			}
		};
	})();

	
	app.request = (function() {

		var process = function(p, callback) {

			var options = {
				url : '',
				method : 'get',
				type : 'html',
				data : {},
    			processData: true,
				contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
			};

			$.extend(options, p);

			$.ajax({
				type: options.method,
				dataType: options.type,
				url: options.url,
				data: options.data,
				contentType: options.contentType,
				processData: options.processData,
				success: function(response){

					if (options.type === 'json' && typeof response === 'string')
						response = JSON.stringify(response);

					if (typeof callback === 'function')
						return callback(response);

					return response;
				},
				error: function(response) {

					if(response.responseText)
						console.log('Error Response: ' + response.responseText);
					else
						console.log(response);
					
					return;
				}
			});
		};

		var submit = function($form, callback, type) {

			if (!$form.length)
				return false;

			var multipart = window.FormData && $form.find('input[type="file"]').length,
				options = {
					'url' : $form.data('ajax') || $form.attr('action') || '',
					'method': $form.attr('method'),
					'type' : type || 'json',
					'data' : multipart ? new FormData($form[0]) : $form.serialize()
				};

			if (multipart)
				options.contentType = false;
			
			if (multipart)
				options.processData = false;

			process(
				options,
				callback
				);
		};

		var load = function(url, place) {

			var $where = $(place);

			if (!$where.length)
				return false;

			process({url:url}, function(response) {

				$where.html(response).initBlocks();
				if ($where.find('.scrolling').length)
					app.scrolling.reinit($where.find('.scrolling'));


				if ($where.find('.i-tooltip').length)
					app.tooltip.init($where.find('.i-tooltip'));
			});
		};

		return {
			'process' : process,
			'submit' : submit,
			'load' : load
		};
	})();



	app.hash = (function() {

		var set = function(rel) {

			window.location.hash = rel;
		};

		var clear = function() {


			if (!history.pushState)
				return false;

			history.pushState(
				"",
				document.title,
				window.location.pathname + window.location.search
				);
		};

		var get = function() {

			return window.location.hash.substring(1);
		};

		return {
			'set' : set,
			'clear' : clear,
			'get' : get
		}
	})();



	app.validate = (function() {

		var email = function(value) {

			var mask = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return mask.test(value);
		};

		var string = function(value, length, max) {

			var length = length || 1,
				max = max || 999999;

			if (typeof value !== 'string')
				return false;

			return value.length >= length && value.length <= max;
		};

		var integer = function(value, length, max) {

			var length = length || 1,
				valid;

			if (typeof value !== 'string')
				return false;

			value = value.replace(/[^0-9]/g, '');

			valid = value.length >= length;

			if (valid && max)
				valid = value.length <= max;

			return valid;
		};

		var range = function(value, min, max) {

			value = parseInt(value);

			return value >= min && value <= max;
		};

		return {
			'email' : email,
			'string' : string,
			'range' : range,
			'integer' : integer
		}
	})();


	app.format = (function() {

		var price = function(value) {
			
			return value.toString().replace(/(\d{1,3}(?=(\d{3})+(?:\.\d|\b)))/g,"\$1 ");
		};

		var getInt = function(value) {

			return parseInt(value.replace(' ', ''));
		}

		return {
			'price' : price,
			'getInt' : getInt
		}
	})();

	app.forms = (function() {

			var s = {
				'main' : $('.forms_ajax'),
				'form' : '.forms__self',
				'field' : '.forms__field',
				'error' : 'forms__field_error',
				'valid' : 'forms__field_valid',
				'container' : '.forms__container',
				'button' : '.forms__button',
				'loading' : 'forms_loading',
				'$error' : '.forms__error',
				'reload' : '.forms__reload',
				'file' : '.forms__file',
				'filename' : {
					s : '.feedback__file-name',
					hidden : 'feedback__file-name_hidden'
				}
			},
				checkTimeout;

			var init = function() {

				s.main.on('change','input,textarea', _validateField);
				s.main.on('keyup', 'input', _hideError);

				s.main.on('click', s.$error, _hideFieldError);

				s.main.on('submit', s.form, _submit);
				s.main.on('click', s.reload, _reload);

				s.main.on('click', '.forms__upload', _triggerUpload);
				s.main.on('change', s.file, _upload);
				s.main.on('click', s.filename.s, _remove);
			};


			var _triggerUpload = function(e) {

				var $this = $(e.target),
					$form = $this.closest(s.form),
					$input = $form.find(s.file);

				$input.trigger('click');
			};


			var _upload = function(e) {

				var $input = $(e.target),
					files = $input[0].files || {};

				for(var i=0; i < files.length; i++) {

					var file = files[i];

					_showName($input, file.name);
				}
			};

			var _showName = function($input, name) {

				var $name = $input.closest(s.form).find(s.filename.s);

				$name.text(name).removeClass(s.filename.hidden);
			};

			var _remove =function(e) {

				var $this = $(e.target);

				$this.empty().addClass(s.filename.hidden);
				$this.closest(s.form).find(s.file).attr('value','');
			};

			var _submit = function(e) {
				e.preventDefault();
				e.stopPropagation();

				var $form = $(e.target),
					$main = $form.closest(s.main),
					$container = $form.closest(s.container);

				_hideErrors($form);

				if (!_checkForm($form)) {

					$form.find('input').each(function() {

						_validate($(this), true);
					});
					return false;
				}


				$main.addClass(s.loading);
				app.request.submit($form, function(response) {

					setTimeout(function() {

						$main.removeClass(s.loading);
						$container.html(response);
					}, ($main.find(s.button).data('timeout') || 0));
				}, 'html');
			};

			var _reload = function(e) {

				e.preventDefault();
				e.stopPropagation();

				var $link = $(e.target).closest(s.reload),
					$container = $link.closest(s.container),
					link;


				if (link = $link.attr('href'))
					app.request.load(link, $container);
			};


			var _validateField = function(e) {

				var $this = $(e.target);

				_validate($this, true);
				_checkForm($this.closest(s.form));
			};


			var _hideErrors = function($form) {

				$form.find(s.field).removeClass(s.error);
			};	


			var _hideFieldError = function(e) {

				var $this = $(e.target);
				$this.closest(s.field).removeClass(s.error)
						.find('input,textarea').focus();
			};

			var _hideError = function(e) {

				var $this = $(e.target);

				$this.closest(s.field).removeClass(s.error);

				if (checkTimeout)
					clearTimeout(checkTimeout);

				checkTimeout = setTimeout(function() {

					_checkForm($this.closest(s.form));
				}, 1000);
			};


			var _checkForm = function($form) {

				var valid,
					formValid = true;

				$form.find('input,textarea').each(function() {

					valid = _validate($(this));

					if (!valid)
						formValid = false;
				});
				return formValid;

				if (formValid)
					$form.find('button').prop('disabled', '');
				else
					$form.find('button').prop('disabled','disabled');


			};


			var _validate = function($el, show, rule) {

				var	rule = $el.data('validate') || rule,
					alternate = $el.data('alternate'),
					value = $el.val(),
					valid = false;

				if (!rule)
					return true;

				var rules = rule.split(':'),
					$field = $el.closest(s.field);

				switch (rules[0]) {

					case 'email' :
						valid = app.validate.email(value);
					break;

					case 'string' :
						var length = rules[1];
						valid = app.validate.string(value, length);
					break;

					case 'integer' :
						var length = rules[1];
						valid = app.validate.integer(value, length);
					break;

					default: 
						valid = true;
					break;
				}

				if (!valid && alternate) {

					var alt_rules = alternate.split(':'),
						$next_input = $el.closest(s.form).find('input[name="'+ alt_rules[0] +'"]'),
						$next_field = $next_input.closest(s.field),
						valid_other;

					if ($next_input.length)
						valid_other = _validate($next_input, false, alt_rules[1] + ':' + alt_rules[2]);

					if (valid_other)
						valid = true;

					if (show && $next_field && !valid_other)
						$next_field.addClass(s.error);
				}

				if (valid_other) {

					$field.removeClass(s.error);
					$next_field.removeClass(s.error);
				}
					

				if (show)
					valid ? $field.removeClass(s.error).addClass(s.valid) : $field.addClass(s.error).removeClass(s.valid);
				else
					return valid;
			};

			init();

			return {};
		})();
	})(jQuery);