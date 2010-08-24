{
/*
 * Shorten, a jQuery plugin to automatically shorten text to fit in a block or a pre-set width and configure how the text ends.
 * Copyright (C) 2009-2010  Marc Diethelm
 * License: (GPL 3, http://www.gnu.org/licenses/gpl-3.0.txt) see license.txt
 */


// a dummy block, so I can collapse all the meta stuff in the editor
/****************************************************************************
 * jQuery 1.3.x plugin to shorten styled text to fit in a block, appending
 * an ellipsis ("...", &hellip;, Unicode: 2026) or other text.
 * (Only supports ltr text for now.)
 *
 * This is achieved by placing the text of the 'selected' element (eg. span or
 * div) inside a table and measuring its width. If it's too big to big to fit in
 * the element's parent block it's shortened and measured again until it (and
 * appended ellipsis or text) fits inside the block. A tooltip on the 'selected'
 * element displays the full original text.
 *
 * If the browser supports truncating text using the 'text-overflow:ellipsis'
 * CSS property then that will be used (if the text to append is the default
 * ellipsis).
 *
 * If the text is truncated by the plugin any markup in the text will be
 * stripped (eg: "<a" starts stripping, "< a" does not). This behaviour is
 * dictated by the jQuery .text(val) method.
 * The appended text may contain HTML however (a link or span for example).
 *
 * Usage Example ('selecting' a div with an id of "element"):

	<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js"></script>
	<script type="text/javascript" src="jquery.textTruncate.js"></script>
	<script type="text/javascript">
		$(function() {
			$("#element").textTruncate();
		});
	</script>

 * By default the plugin will use the parent block's width as maximum width and
 * an ellipsis as appended text when truncating.
 *
 * There are three ways of configuring the plugin:
 *
 * 1) Passing a configuration hash as the plugin's argument, eg:

	.textTruncate({
		width: 300,
		tail: ' <a href="#">more</a>',
		tooltip: false
	});

 * 2) Using two optional arguments (deprecated!):
 * width = the desired pixel width, integer
 * tail = text/html to append when truncating
 *
 * 3) By changing the plugin defaults, eg:

	$.fn.textTruncate.defaults.tail = ' <a href="#">more</a>';

 * Note: there is no default width (unless you create one).
 *
 * You may want to set the element's css to {visibility:hidden;} so it won't
 * initially flash at full width.
 *
 *
 * Based on a creation by M. David Green (www.mdavidgreen.com) in 2009.
 *
 * Heavily modified/simplified/improved by Marc Diethelm (http://web5.me/).
 *
****************************************************************************/
}


(function ($) {

	//var $c = console;

	$.fn.textTruncate = function() {

		var userOptions = {},
			args = arguments, // for better minification
			func = args.callee // dito; and much shorter than $.fn.textTruncate

		if ( args.length ) {

			if ( args[0].constructor == Object ) {
				userOptions = args[0];
			} else if ( args[0] == "options" ) {
				return $(this).eq(0).data("options-truncate");
			} else {
				userOptions = {
					width: parseInt(args[0]),
					tail: args[1]
				}
			}
		}

		this.css("visibility","hidden"); // Hide the element(s) while manipulating them

		// apply options vs. defaults
		var options = $.extend({}, func.defaults, userOptions);


		/**
		 * HERE WE GO!
		 **/
		return this.each(function () {

			var $this = $(this);
			$this.data("options-truncate", options);

			/**
			 * If browser implements text-overflow:ellipsis in CSS and tail is "...", use it!
			 **/
			if ( options.tail == "..." && func._native ) {

				this.style[func._native] = "ellipsis";
				/*var css_obj = {}
				css_obj[func._native] = "ellipsis";
				$this.css(css_obj);*/
				$this.css("visibility","visible");

				return true;
			}


			var targetWidth = options.width || $this.parent().width(),
				text = $this.text(),
				textlength = text.length,
				measureContext, // canvas context or table cell
				measureText, // function that measures text width
				tailText = $("<span/>").html(options.tail).text(), // convert html to text
				tailWidth;


			// decide on a method for measuring text width
			if ( func._supportsCanvas ) {
				//$c.log("canvas");
				measureContext = func.measureText_initCanvas.call( this );
				measureText = func.measureText_canvas;

			} else {
				//$c.log("table")
				measureContext = func.measureText_initTable.call( this );
				measureText = func.measureText_table;
			}

			if ( measureText.call( this, text, measureContext ) < targetWidth ) {
				$this.text( text );
				this.style.visibility = "visible";
				return true;
			}

			tailWidth = measureText.call( this, tailText, measureContext ); // convert html to text and measure it
			targetWidth = targetWidth - tailWidth;

				//$c.log("tailText: "+ tailText);
				//$c.log("tailWidth: "+ tailWidth);
				//$c.log("targetWidth: "+ targetWidth);
				//$c.log(measureText.call( this, text, measureContext ) + "px: "+ text);

			do {
				textlength--;
				text = text.substring(0, textlength);
				//$c.log(measureText.call( this, text, measureContext ) + "px: "+ text);

			} while ( measureText.call( this, text, measureContext ) >= targetWidth );

			$this.html( $.trim( $("<span/>").text(text).html() ) + options.tail );
			this.style.visibility = "visible";

			return true;
		});

		return true;

	};



	var css = document.documentElement.style;
	var _native = false;

	if ( "textOverflow" in css ) {
		_native = "textOverflow";
	} else if ( "OTextOverflow" in css ) {
		_native = "OTextOverflow";
	} else {
		// test for canvas support
		var canvas = document.createElement("canvas"),
			ctx = canvas.getContext("2d");

		$.fn.textTruncate._supportsCanvas =  (ctx ? true : false);
		delete canvas;
	}

	$.fn.textTruncate._native = _native;



	$.fn.textTruncate.measureText_initCanvas = function initCanvas()
	{
		var $this = $(this);
		var canvas = document.createElement("canvas");
			//scanvas.setAttribute("width", 500); canvas.setAttribute("height", 40);
		ctx = canvas.getContext("2d");
		$this.html( canvas );

		/* the rounding is experimental. it fixes a problem with a font size specified as 0.7em which resulted in a computed size of 11.2px.
		  without rounding the measured font was too small. even with rounding the result differs slightly from the table method's results. */
		ctx.font = Math.ceil(parseFloat($this.css("font-size"))) +"px "+ $this.css("font-family") +" "+ $this.css("font-weight") +" "+ $this.css("font-style");

		return ctx;
	}

	// measurement using canvas
	$.fn.textTruncate.measureText_canvas = function measureText_canvas( text, ctx )
	{
			//ctx.fillStyle = "red"; ctx.fillRect (0, 0, 500, 40);
			//ctx.fillStyle = "black"; ctx.fillText(text, 0, 20);

		return ctx.measureText(text).width;
	};

	$.fn.textTruncate.measureText_initTable = function() {
		var css = "padding:0; margin:0; border:none; font:inherit;";
		var $table = $('<table style="'+ css +'width:auto;zoom:1;position:absolute;"><tr style="'+ css +'"><td style="'+ css +'white-space:nowrap;"></td></tr></table>');
		$td = $("td", $table);

		$(this).html( $table );

		return $td;
	};

	// measurement using temp table
	$.fn.textTruncate.measureText_table = function measureText_table( text, $td )
	{
		$td.text( text );

		return $td.width();
	};


	$.fn.textTruncate.defaults = {
		tail: "&hellip;",
		tooltip: true
	};

})(jQuery);
