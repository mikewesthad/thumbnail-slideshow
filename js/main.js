(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var ಠ = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='; // transparent image, used as accessor and replacing image
var propRegex = /(object-fit|object-position)\s*:\s*([-\w\s%]+)/g;
var testImg = new Image();
var supportsObjectFit = 'object-fit' in testImg.style;
var supportsObjectPosition = 'object-position' in testImg.style;
var supportsCurrentSrc = typeof testImg.currentSrc === 'string';
var nativeGetAttribute = testImg.getAttribute;
var nativeSetAttribute = testImg.setAttribute;
var autoModeEnabled = false;

function getStyle(el) {
	var style = getComputedStyle(el).fontFamily;
	var parsed;
	var props = {};
	while ((parsed = propRegex.exec(style)) !== null) {
		props[parsed[1]] = parsed[2];
	}
	return props;
}

function fixOne(el, requestedSrc) {
	if (el[ಠ].parsingSrcset) {
		return;
	}
	var style = getStyle(el);
	style['object-fit'] = style['object-fit'] || 'fill'; // default value

	// If the fix was already applied, don't try to skip fixing,
	// - because once you go ofi you never go back.
	// - Wait, that doesn't rhyme.
	// - This ain't rap, bro.
	if (!el[ಠ].s) {
		// fill is the default behavior so no action is necessary
		if (style['object-fit'] === 'fill') {
			return;
		}

		// Where object-fit is supported and object-position isn't (Safari < 10)
		if (!el[ಠ].skipTest && // unless user wants to apply regardless of browser support
		supportsObjectFit && // if browser already supports object-fit
		!style['object-position'] // unless object-position is used
		) {
				return;
			}
	}

	var src = el.currentSrc || el.src;

	if (requestedSrc) {
		// explicitly requested src takes precedence
		// TODO: this still should overwrite srcset
		src = requestedSrc;
	} else if (el.srcset && !supportsCurrentSrc && window.picturefill) {
		var pf = window.picturefill._.ns;
		// prevent infinite loop
		// fillImg sets the src which in turn calls fixOne
		el[ಠ].parsingSrcset = true;

		// parse srcset with picturefill where currentSrc isn't available
		if (!el[pf] || !el[pf].evaled) {
			// force synchronous srcset parsing
			window.picturefill._.fillImg(el, { reselect: true });
		}

		if (!el[pf].curSrc) {
			// force picturefill to parse srcset
			el[pf].supported = false;
			window.picturefill._.fillImg(el, { reselect: true });
		}
		delete el[ಠ].parsingSrcset;

		// retrieve parsed currentSrc, if any
		src = el[pf].curSrc || src;
	}

	// store info on object for later use
	if (el[ಠ].s) {
		el[ಠ].s = src;
		if (requestedSrc) {
			// the attribute reflects the user input
			// the property is the resolved URL
			el[ಠ].srcAttr = requestedSrc;
		}
	} else {
		el[ಠ] = {
			s: src,
			srcAttr: requestedSrc || nativeGetAttribute.call(el, 'src'),
			srcsetAttr: el.srcset
		};
		el.src = ಠ;

		// remove srcset because it overrides src
		if (el.srcset) {
			el.srcset = '';

			// restore non-browser-readable srcset property
			Object.defineProperty(el, 'srcset', {
				value: el[ಠ].srcsetAttr
			});
		}

		keepSrcUsable(el);
	}

	el.style.backgroundImage = 'url("' + src + '")';
	el.style.backgroundPosition = style['object-position'] || 'center';
	el.style.backgroundRepeat = 'no-repeat';

	if (/scale-down/.test(style['object-fit'])) {
		// `object-fit: scale-down` is either `contain` or `auto`
		if (!el[ಠ].i) {
			el[ಠ].i = new Image();
			el[ಠ].i.src = src;
		}

		// naturalWidth is only available when the image headers are loaded,
		// this loop will poll it every 100ms.
		// There's currently no check to prevent this loop from starting twice
		// as a consequence of calling ofi() twice on the same image, but it's light
		// and causes no issues, so it's not worth ensuring that it doesn't.
		(function loop() {
			// https://bugs.chromium.org/p/chromium/issues/detail?id=495908
			if (el[ಠ].i.naturalWidth) {
				if (el[ಠ].i.naturalWidth > el.width || el[ಠ].i.naturalHeight > el.height) {
					el.style.backgroundSize = 'contain';
				} else {
					el.style.backgroundSize = 'auto';
				}
				return;
			}
			setTimeout(loop, 100);
		})();
	} else {
		el.style.backgroundSize = style['object-fit'].replace('none', 'auto').replace('fill', '100% 100%');
	}
}

function keepSrcUsable(el) {
	var descriptors = {
		get: function () {
			return el[ಠ].s;
		},
		set: function (src) {
			delete el[ಠ].i; // scale-down's img sizes need to be updated too
			fixOne(el, src);
			return src;
		}
	};
	Object.defineProperty(el, 'src', descriptors);
	Object.defineProperty(el, 'currentSrc', { get: descriptors.get }); // it should be read-only
}

function hijackAttributes() {
	if (!supportsObjectPosition) {
		HTMLImageElement.prototype.getAttribute = function (name) {
			if (this[ಠ] && (name === 'src' || name === 'srcset')) {
				return this[ಠ][name + 'Attr'];
			}
			return nativeGetAttribute.call(this, name);
		};

		HTMLImageElement.prototype.setAttribute = function (name, value) {
			if (this[ಠ] && (name === 'src' || name === 'srcset')) {
				this[name === 'src' ? 'src' : name + 'Attr'] = String(value);
			} else {
				nativeSetAttribute.call(this, name, value);
			}
		};
	}
}

function fix(imgs, opts) {
	var startAutoMode = !autoModeEnabled && !imgs;
	opts = opts || {};
	imgs = imgs || 'img';
	if (supportsObjectPosition && !opts.skipTest) {
		return false;
	}

	// use imgs as a selector or just select all images
	if (typeof imgs === 'string') {
		imgs = document.querySelectorAll('img');
	} else if (!imgs.length) {
		imgs = [imgs];
	}

	// apply fix to all
	for (var i = 0; i < imgs.length; i++) {
		imgs[i][ಠ] = imgs[i][ಠ] || opts;
		fixOne(imgs[i]);
	}

	if (startAutoMode) {
		document.body.addEventListener('load', function (e) {
			if (e.target.tagName === 'IMG') {
				fix(e.target, {
					skipTest: opts.skipTest
				});
			}
		}, true);
		autoModeEnabled = true;
		imgs = 'img'; // reset to a generic selector for watchMQ
	}

	// if requested, watch media queries for object-fit change
	if (opts.watchMQ) {
		window.addEventListener('resize', fix.bind(null, imgs, {
			skipTest: opts.skipTest
		}));
	}
}

fix.supportsObjectFit = supportsObjectFit;
fix.supportsObjectPosition = supportsObjectPosition;

hijackAttributes();

module.exports = fix;
},{}],2:[function(require,module,exports){
var slideshows = require("./slideshow.js");
slideshows.init();

require("object-fit-images")();
},{"./slideshow.js":4,"object-fit-images":1}],3:[function(require,module,exports){
module.exports = SlideshowModal;

var KEY_CODES = {
    LEFT_ARROW: 37,
    RIGHT_ARROW: 39,
    ESCAPE: 27
};

function SlideshowModal($container, slideshow) {
    this._slideshow = slideshow;

    this._$modal = $container.find(".slideshow-modal");
    this._$overlay = this._$modal.find(".modal-overlay");
    this._$content = this._$modal.find(".modal-contents");
    this._$caption = this._$modal.find(".modal-caption");
    this._$imageContainer = this._$modal.find(".modal-image");
    this._$imageLeft = this._$modal.find(".image-advance-left");
    this._$imageRight = this._$modal.find(".image-advance-right");

    this._index = 0; // Index of selected image
    this._isOpen = false;
    
    this._$imageLeft.on("click", this.advanceLeft.bind(this));
    this._$imageRight.on("click", this.advanceRight.bind(this));
    $(document).on("keydown", this._onKeyDown.bind(this));

    // Give jQuery control over showing/hiding
    this._$modal.css("display", "block");
    this._$modal.hide();

    // Events
    $(window).on("resize", this._onResize.bind(this));
    this._$overlay.on("click", this.close.bind(this));
    this._$modal.find(".modal-close").on("click", this.close.bind(this));
    
    this._updateControls();

    // Size of fontawesome icons needs a slight delay (until stack is clear) for
    // some reason
    setTimeout(function () {
        this._onResize();
    }.bind(this), 0);
}

SlideshowModal.prototype.advanceLeft = function () {
    this.showImageAt(this._index - 1);
};

SlideshowModal.prototype.advanceRight = function () {
    this.showImageAt(this._index + 1);
};

SlideshowModal.prototype.showImageAt = function (index) {
    index = Math.max(index, 0);
    index = Math.min(index, this._slideshow.getNumImages() - 1);
    this._index = index;
    var $img = this._slideshow.getGalleryImage(this._index);
    var caption = this._slideshow.getCaption(this._index);

    this._$imageContainer.empty();
    $("<img>", {src: $img.attr("src")})
        .appendTo(this._$imageContainer);

    this._$caption.empty();
    if (caption) {
        $("<span>").addClass("figure-number")
            .text("Fig. " + (this._index + 1) + ": ")
            .appendTo(this._$caption);
        $("<span>").addClass("caption-text")
            .text(caption)
            .appendTo(this._$caption);
    }
    
    this._onResize();
    this._updateControls();
};

SlideshowModal.prototype.open = function (index) {
    index = index || 0;
    this._$modal.show();
    this.showImageAt(index);
    this._isOpen = true;
};

SlideshowModal.prototype.close = function () {
    this._$modal.hide();
    this._isOpen = false;
};

SlideshowModal.prototype._onKeyDown = function (e) {
    if (!this._isOpen) return;
    if (e.which === KEY_CODES.LEFT_ARROW) {
        this.advanceLeft();
    } else if (e.which === KEY_CODES.RIGHT_ARROW) {
        this.advanceRight();
    } else if (e.which === KEY_CODES.ESCAPE) {
        this.close();   
    }
};

SlideshowModal.prototype._updateControls = function () {
    // Re-enable
    this._$imageRight.removeClass("disabled");
    this._$imageLeft.removeClass("disabled");
    
    // Disable if we've reached the the max or min limit
    if (this._index >= (this._slideshow.getNumImages() - 1)) {
        this._$imageRight.addClass("disabled");
    } else if (this._index <= 0) {
        this._$imageLeft.addClass("disabled");
    }
};

SlideshowModal.prototype._onResize = function () {
    var $image = this._$imageContainer.find("img");

    // Reset the content's width
    this._$content.width("");

    // Find the size of the components that need to be displayed in addition to 
    // the image
    var controlsWidth = this._$imageLeft.outerWidth(true) + 
        this._$imageRight.outerWidth(true);
    // Hack for now - budget for 2x the caption height. 
    var captionHeight = 2 * this._$caption.outerHeight(true); 
    var imagePadding = $image.innerWidth();

    // Calculate the available area for the modal
    var mw = this._$modal.width() - controlsWidth;
    var mh = this._$modal.height() - captionHeight;

    // Fit the image to the remaining screen real estate 
    var setSize = function () {
        var iw = $image.prop("naturalWidth");
        var ih = $image.prop("naturalHeight");
        var sw = iw / mw;
        var sh = ih / mh;
        var s = Math.max(sw, sh);

        // Set width/height using CSS in order to respect box-sizing
        if (s > 1) {
            $image.css("width", iw / s + "px");
            $image.css("height", ih / s + "px");
        } else {
            $image.css("width", iw + "px");
            $image.css("height", ih + "px");
        }

        this._$imageRight.css("top", $image.outerHeight() / 2 + "px");
        this._$imageLeft.css("top", $image.outerHeight() / 2 + "px");

        // Set the content wrapper to be the width of the image. This will keep 
        // the caption from expanding beyond the image.
        this._$content.width($image.outerWidth(true));        
    }.bind(this);

    if ($image.prop("complete")) setSize();
    else $image.one("load", setSize);
};

},{}],4:[function(require,module,exports){
var SlideshowModal = require("./slideshow-modal.js");
var ThumbnailSlider = require("./thumbnail-slider.js");

module.exports = {
    init: function(transitionDuration) {
        transitionDuration = (transitionDuration !== undefined) ?
            transitionDuration : 400;
        this._slideshows = [];
        $(".slideshow").each(function (index, element) {
            var slideshow = new Slideshow($(element), transitionDuration);
            this._slideshows.push(slideshow);
        }.bind(this));
    }
};

function Slideshow($container, transitionDuration) {
    this._transitionDuration = transitionDuration;
    this._$container = $container;
    this._index = 0; // Index of selected image

    // Create components
    this._thumbnailSlider = new ThumbnailSlider($container, this);
    this._modal = new SlideshowModal($container, this);

    // Cache and create necessary DOM elements   
    this._$captionContainer = $container.find(".caption");
    this._$selectedImageContainer = $container.find(".selected-image");

    // Open modal on clicking selected image
    this._$selectedImageContainer.on("click", function () {
        this._modal.open(this._index);    
    }.bind(this));

    // Load images
    this._$galleryImages = this._loadGalleryImages();
    this._numImages = this._$galleryImages.length;

    // Show the first image
    this.showImage(0);
}

Slideshow.prototype.getActiveIndex = function () {
    return this._index;
};

Slideshow.prototype.getNumImages = function () {
    return this._numImages;
};

Slideshow.prototype.getGalleryImage = function (index) {
    return this._$galleryImages[index];
};

Slideshow.prototype.getCaption = function (index) {
    return this._$galleryImages[index].data("caption");
};

Slideshow.prototype.showImage = function (index) {
    // Reset all images to invisible and lowest z-index. This could be smarter,
    // like HoverSlideshow, and only reset exactly what we need, but we aren't 
    // wasting that many cycles.
    this._$galleryImages.forEach(function ($galleryImage) {
        $galleryImage.css({
            "zIndex": 0,
            "opacity": 0
        });
        $galleryImage.velocity("stop"); // Stop any animations
    }, this);

    // Cache references to the last and current image
    var $lastImage = this._$galleryImages[this._index];
    var $currentImage = this._$galleryImages[index];
    this._index = index;

    // Make the last image visisble and then animate the current image into view
    // on top of the last
    $lastImage.css("zIndex", 1);
    $currentImage.css("zIndex", 2);
    $lastImage.css("opacity", 1);
    $currentImage.velocity({"opacity": 1}, this._transitionDuration, 
        "easeInOutQuad");

    // Create the caption, if it exists on the thumbnail
    var caption = $currentImage.data("caption");
    if (caption) {
        this._$captionContainer.empty();
        $("<span>").addClass("figure-number")
            .text("Fig. " + (this._index + 1) + ": ")
            .appendTo(this._$captionContainer);
        $("<span>").addClass("caption-text")
            .text(caption)
            .appendTo(this._$captionContainer);
    }

    // Object image fit polyfill breaks jQuery attr(...), so fallback to just 
    // using element.src
    // TODO: Lazy!
    // if ($currentImage.get(0).src === "") {
    //     $currentImage.get(0).src = $currentImage.data("image-url");
    // }
};

Slideshow.prototype._loadGalleryImages = function () {
    // Create empty images in the gallery for each thumbnail. This helps us do
    // lazy loading of gallery images and allows us to cross-fade images.
    var $galleryImages = [];
    for (var i = 0; i < this._thumbnailSlider.getNumThumbnails(); i += 1) {
        // Get the thumbnail element which has path and caption data
        var $thumb = this._thumbnailSlider.get$Thumbnail(i);

        // Calculate the id from the path to the large image
        var largePath = $thumb.data("large-path");
        var id = largePath.split("/").pop().split(".")[0];

        // Create a gallery image element
        var $galleryImage = $("<img>", {id: id})
            .css({
                position: "absolute",
                top: "0px",
                left: "0px",
                opacity: 0,
                zIndex: 0
            })
            .data("image-url", largePath)            
            .data("caption", $thumb.data("caption"))
            .appendTo(this._$selectedImageContainer);
        $galleryImage.get(0).src = largePath; // TODO: Make this lazy!
        $galleryImages.push($galleryImage);
    }
    return $galleryImages;
};
},{"./slideshow-modal.js":3,"./thumbnail-slider.js":5}],5:[function(require,module,exports){
module.exports = ThumbnailSlider;

function ThumbnailSlider($container, slideshow) {
    this._$container = $container;
    this._slideshow = slideshow;

    this._index = 0; // Index of selected thumbnail
    this._scrollIndex = 0; // Index of the thumbnail that is currently centered

    // Cache and create necessary DOM elements
    this._$thumbnailContainer = $container.find(".thumbnails");
    this._$thumbnailImages = this._$thumbnailContainer.find("img");
    this._$visibleThumbnailWrap = $container.find(".visible-thumbnails");
    this._$advanceLeft = $container.find(".thumbnail-advance-left");
    this._$advanceRight = $container.find(".thumbnail-advance-right");

    // Loop through the thumbnails, give them an index data attribute and cache
    // a reference to them in an array
    this._$thumbnails = [];
    this._$thumbnailImages.each(function (index, element) {
        var $thumbnail = $(element);
        $thumbnail.data("index", index);
        this._$thumbnails.push($thumbnail);
    }.bind(this));
    this._numImages = this._$thumbnails.length;

    // Left/right controls
    this._$advanceLeft.on("click", this.advanceLeft.bind(this));
    this._$advanceRight.on("click", this.advanceRight.bind(this));

    // Clicking a thumbnail
    this._$thumbnailImages.on("click", this._onClick.bind(this));

    this._activateThumbnail(0);

    // Resize
    $(window).on("resize", this._onResize.bind(this));

    // For some reason, the sizing on the controls is messed up if it runs
    // immediately - delay sizing until stack is clear
    setTimeout(function () {
        this._onResize();
    }.bind(this), 0);
}

ThumbnailSlider.prototype.getActiveIndex = function () {
    return this._index;
};

ThumbnailSlider.prototype.getNumThumbnails = function () {
    return this._numImages;
};

ThumbnailSlider.prototype.get$Thumbnail = function (index) {
    return this._$thumbnails[index];
};

ThumbnailSlider.prototype.advanceLeft = function () {
    var newIndex = this._scrollIndex - this._numVisible;
    newIndex = Math.max(newIndex, 0);
    this._scrollToThumbnail(newIndex);
};

ThumbnailSlider.prototype.advanceRight = function () {
    var newIndex = this._scrollIndex + this._numVisible;
    newIndex = Math.min(newIndex, this._numImages - 1);
    this._scrollToThumbnail(newIndex);
};

ThumbnailSlider.prototype._resetSizing = function () {
    // Reset sizing variables. This includes resetting any inline style that has
    // been applied, so that any size calculations can be based on the CSS
    // styling.
    this._$thumbnailContainer.css({
        top: "", left: "", width: "", height: ""
    });
    this._$visibleThumbnailWrap.width("");
    this._$visibleThumbnailWrap.height("");
    // Make all thumbnails square and reset any height
    this._$thumbnails.forEach(function ($element) { 
        $element.height(""); // Reset height before setting width
        $element.width($element.height());
    });
};

ThumbnailSlider.prototype._onResize = function () {
    this._resetSizing();

    // Calculate the size of the first thumbnail. This assumes the first image
    // only has a right-side margin.
    var $firstThumb = this._$thumbnails[0];
    var thumbSize = $firstThumb.outerHeight(false);
    var thumbMargin = 2 * ($firstThumb.outerWidth(true) - thumbSize);

    // Measure controls. They need to be visible in order to be measured.
    this._$advanceRight.css("display", "block");
    this._$advanceLeft.css("display", "block");
    var thumbControlWidth = this._$advanceRight.outerWidth(true) +
        this._$advanceLeft.outerWidth(true);

    // Calculate how many thumbnails can fit within the thumbnail area
    var visibleWidth = this._$visibleThumbnailWrap.outerWidth(false);
    var numThumbsVisible = (visibleWidth - thumbMargin) / 
        (thumbSize + thumbMargin);

    // Check whether all the thumbnails can fit on the screen at once
    if (numThumbsVisible < this._numImages) {
        this._allThumbnailSliderVisible = false;
        // Take a best guess at how to size the thumbnails. Size formula:
        //  width = num * thumbSize + (num - 1) * thumbMargin + controlSize
        // Solve for number of thumbnails and round to the nearest integer so 
        // that we don't have any partial thumbnails showing.
        numThumbsVisible = Math.round(
            (visibleWidth - thumbControlWidth + thumbMargin) / 
            (thumbSize + thumbMargin)
        );

        // Use this number of thumbnails to calculate the thumbnail size
        var newSize = (visibleWidth - thumbControlWidth + thumbMargin) / 
            numThumbsVisible - thumbMargin;
        this._$thumbnails.forEach(function ($element) {
            // $.width and $.height set the content size regardless of the 
            // box-sizing. The images are border-box, so we want the CSS width
            // and height. This allows the active image to have a border and the
            // other images to have padding. 
            $element.css("width", newSize + "px");
            $element.css("height", newSize + "px");
        });

        // Set the thumbnail wrap size. It should be just tall enough to fit a
        // thumbnail and long enough to hold all the thumbnails in one line:
        var totalSize = newSize * this._numImages + 
            thumbMargin * (this._numImages - 1);
        this._$thumbnailContainer.css({
            width: totalSize + "px",
            height: $firstThumb.outerHeight(true) + "px"
        });

        // Set the visible thumbnail wrap size. This is used to maks the much 
        // larger thumbnail container. It should be as wide as it can be, minus
        // the space needed for the left/right contols.
        this._$visibleThumbnailWrap.css({
            width: visibleWidth - thumbControlWidth + "px",
            height: $firstThumb.outerHeight(true) + "px"
        });
    } else {
        // All thumbnails are visible, we can hide the controls and expand the
        // thumbnail container to 100%
        this._allThumbnailSliderVisible = true;
        this._$thumbnailContainer.css("width", "100%");
        this._$advanceRight.css("display", "none");
        this._$advanceLeft.css("display", "none");
    }

    this._numVisible = numThumbsVisible;
    this._updateThumbnailControls();
};

ThumbnailSlider.prototype._activateThumbnail = function (index) {
    // Activate/deactivate thumbnails
    this._$thumbnails[this._index].removeClass("active");
    this._$thumbnails[index].addClass("active");
};

ThumbnailSlider.prototype._scrollToThumbnail = function (index) {
    // Constrain index so that we can't scroll out of bounds 
    var midScrollIndex = Math.floor((this._numVisible - 1) / 2);
    var minScrollIndex = midScrollIndex;
    var maxScrollIndex = this._numImages - 1 - midScrollIndex;
    index = Math.max(index, minScrollIndex);
    index = Math.min(index, maxScrollIndex);

    this._scrollIndex = index;

    // Find the "left" position of the thumbnail container that would put the 
    // thumbnail at index at the center
    var $thumb = this._$thumbnails[0];
    var size = parseFloat($thumb.css("width"));
    var margin = 2 * parseFloat($thumb.css("margin-right")); 
    var centerX = size * midScrollIndex + margin * (midScrollIndex - 1);
    var thumbX = size * index + margin * (index - 1);
    var left = centerX - thumbX;

    // Animate the thumbnail container
    this._$thumbnailContainer.velocity("stop");
    this._$thumbnailContainer.velocity({
        "left": left + "px"
    }, 600, "easeInOutQuad");

    this._updateThumbnailControls();
};

ThumbnailSlider.prototype._onClick = function (e) {
    var $target = $(e.target);
    var index = $target.data("index");
    
    // Clicked on the active image - no need to do anything
    if (this._index !== index) {
        this._activateThumbnail(index);
        this._scrollToThumbnail(index);
        this._index = index;
        this._slideshow.showImage(index);
    }
};

ThumbnailSlider.prototype._updateThumbnailControls = function () {
    // Re-enable
    this._$advanceLeft.removeClass("disabled");
    this._$advanceRight.removeClass("disabled");
    
    // Disable if we've reached the the max or min limit
    var midScrollIndex = Math.floor((this._numVisible - 1) / 2);
    var minScrollIndex = midScrollIndex;
    var maxScrollIndex = this._numImages - 1 - midScrollIndex;
    if (this._scrollIndex >= maxScrollIndex) {
        this._$advanceRight.addClass("disabled");
    } else if (this._scrollIndex <= minScrollIndex) {
        this._$advanceLeft.addClass("disabled");
    }
};
},{}]},{},[2])


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvb2JqZWN0LWZpdC1pbWFnZXMvZGlzdC9vZmkuY29tbW9uLWpzLmpzIiwic3JjL2pzL21haW4uanMiLCJzcmMvanMvc2xpZGVzaG93LW1vZGFsLmpzIiwic3JjL2pzL3NsaWRlc2hvdy5qcyIsInNyYy9qcy90aHVtYm5haWwtc2xpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM05BO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciDgsqAgPSAnZGF0YTppbWFnZS9naWY7YmFzZTY0LFIwbEdPRGxoQVFBQkFJQUFBUC8vL3dBQUFDSDVCQUVBQUFBQUxBQUFBQUFCQUFFQUFBSUNSQUVBT3c9PSc7IC8vIHRyYW5zcGFyZW50IGltYWdlLCB1c2VkIGFzIGFjY2Vzc29yIGFuZCByZXBsYWNpbmcgaW1hZ2VcbnZhciBwcm9wUmVnZXggPSAvKG9iamVjdC1maXR8b2JqZWN0LXBvc2l0aW9uKVxccyo6XFxzKihbLVxcd1xccyVdKykvZztcbnZhciB0ZXN0SW1nID0gbmV3IEltYWdlKCk7XG52YXIgc3VwcG9ydHNPYmplY3RGaXQgPSAnb2JqZWN0LWZpdCcgaW4gdGVzdEltZy5zdHlsZTtcbnZhciBzdXBwb3J0c09iamVjdFBvc2l0aW9uID0gJ29iamVjdC1wb3NpdGlvbicgaW4gdGVzdEltZy5zdHlsZTtcbnZhciBzdXBwb3J0c0N1cnJlbnRTcmMgPSB0eXBlb2YgdGVzdEltZy5jdXJyZW50U3JjID09PSAnc3RyaW5nJztcbnZhciBuYXRpdmVHZXRBdHRyaWJ1dGUgPSB0ZXN0SW1nLmdldEF0dHJpYnV0ZTtcbnZhciBuYXRpdmVTZXRBdHRyaWJ1dGUgPSB0ZXN0SW1nLnNldEF0dHJpYnV0ZTtcbnZhciBhdXRvTW9kZUVuYWJsZWQgPSBmYWxzZTtcblxuZnVuY3Rpb24gZ2V0U3R5bGUoZWwpIHtcblx0dmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbCkuZm9udEZhbWlseTtcblx0dmFyIHBhcnNlZDtcblx0dmFyIHByb3BzID0ge307XG5cdHdoaWxlICgocGFyc2VkID0gcHJvcFJlZ2V4LmV4ZWMoc3R5bGUpKSAhPT0gbnVsbCkge1xuXHRcdHByb3BzW3BhcnNlZFsxXV0gPSBwYXJzZWRbMl07XG5cdH1cblx0cmV0dXJuIHByb3BzO1xufVxuXG5mdW5jdGlvbiBmaXhPbmUoZWwsIHJlcXVlc3RlZFNyYykge1xuXHRpZiAoZWxb4LKgXS5wYXJzaW5nU3Jjc2V0KSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHZhciBzdHlsZSA9IGdldFN0eWxlKGVsKTtcblx0c3R5bGVbJ29iamVjdC1maXQnXSA9IHN0eWxlWydvYmplY3QtZml0J10gfHwgJ2ZpbGwnOyAvLyBkZWZhdWx0IHZhbHVlXG5cblx0Ly8gSWYgdGhlIGZpeCB3YXMgYWxyZWFkeSBhcHBsaWVkLCBkb24ndCB0cnkgdG8gc2tpcCBmaXhpbmcsXG5cdC8vIC0gYmVjYXVzZSBvbmNlIHlvdSBnbyBvZmkgeW91IG5ldmVyIGdvIGJhY2suXG5cdC8vIC0gV2FpdCwgdGhhdCBkb2Vzbid0IHJoeW1lLlxuXHQvLyAtIFRoaXMgYWluJ3QgcmFwLCBicm8uXG5cdGlmICghZWxb4LKgXS5zKSB7XG5cdFx0Ly8gZmlsbCBpcyB0aGUgZGVmYXVsdCBiZWhhdmlvciBzbyBubyBhY3Rpb24gaXMgbmVjZXNzYXJ5XG5cdFx0aWYgKHN0eWxlWydvYmplY3QtZml0J10gPT09ICdmaWxsJykge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFdoZXJlIG9iamVjdC1maXQgaXMgc3VwcG9ydGVkIGFuZCBvYmplY3QtcG9zaXRpb24gaXNuJ3QgKFNhZmFyaSA8IDEwKVxuXHRcdGlmICghZWxb4LKgXS5za2lwVGVzdCAmJiAvLyB1bmxlc3MgdXNlciB3YW50cyB0byBhcHBseSByZWdhcmRsZXNzIG9mIGJyb3dzZXIgc3VwcG9ydFxuXHRcdHN1cHBvcnRzT2JqZWN0Rml0ICYmIC8vIGlmIGJyb3dzZXIgYWxyZWFkeSBzdXBwb3J0cyBvYmplY3QtZml0XG5cdFx0IXN0eWxlWydvYmplY3QtcG9zaXRpb24nXSAvLyB1bmxlc3Mgb2JqZWN0LXBvc2l0aW9uIGlzIHVzZWRcblx0XHQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHR9XG5cblx0dmFyIHNyYyA9IGVsLmN1cnJlbnRTcmMgfHwgZWwuc3JjO1xuXG5cdGlmIChyZXF1ZXN0ZWRTcmMpIHtcblx0XHQvLyBleHBsaWNpdGx5IHJlcXVlc3RlZCBzcmMgdGFrZXMgcHJlY2VkZW5jZVxuXHRcdC8vIFRPRE86IHRoaXMgc3RpbGwgc2hvdWxkIG92ZXJ3cml0ZSBzcmNzZXRcblx0XHRzcmMgPSByZXF1ZXN0ZWRTcmM7XG5cdH0gZWxzZSBpZiAoZWwuc3Jjc2V0ICYmICFzdXBwb3J0c0N1cnJlbnRTcmMgJiYgd2luZG93LnBpY3R1cmVmaWxsKSB7XG5cdFx0dmFyIHBmID0gd2luZG93LnBpY3R1cmVmaWxsLl8ubnM7XG5cdFx0Ly8gcHJldmVudCBpbmZpbml0ZSBsb29wXG5cdFx0Ly8gZmlsbEltZyBzZXRzIHRoZSBzcmMgd2hpY2ggaW4gdHVybiBjYWxscyBmaXhPbmVcblx0XHRlbFvgsqBdLnBhcnNpbmdTcmNzZXQgPSB0cnVlO1xuXG5cdFx0Ly8gcGFyc2Ugc3Jjc2V0IHdpdGggcGljdHVyZWZpbGwgd2hlcmUgY3VycmVudFNyYyBpc24ndCBhdmFpbGFibGVcblx0XHRpZiAoIWVsW3BmXSB8fCAhZWxbcGZdLmV2YWxlZCkge1xuXHRcdFx0Ly8gZm9yY2Ugc3luY2hyb25vdXMgc3Jjc2V0IHBhcnNpbmdcblx0XHRcdHdpbmRvdy5waWN0dXJlZmlsbC5fLmZpbGxJbWcoZWwsIHsgcmVzZWxlY3Q6IHRydWUgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFlbFtwZl0uY3VyU3JjKSB7XG5cdFx0XHQvLyBmb3JjZSBwaWN0dXJlZmlsbCB0byBwYXJzZSBzcmNzZXRcblx0XHRcdGVsW3BmXS5zdXBwb3J0ZWQgPSBmYWxzZTtcblx0XHRcdHdpbmRvdy5waWN0dXJlZmlsbC5fLmZpbGxJbWcoZWwsIHsgcmVzZWxlY3Q6IHRydWUgfSk7XG5cdFx0fVxuXHRcdGRlbGV0ZSBlbFvgsqBdLnBhcnNpbmdTcmNzZXQ7XG5cblx0XHQvLyByZXRyaWV2ZSBwYXJzZWQgY3VycmVudFNyYywgaWYgYW55XG5cdFx0c3JjID0gZWxbcGZdLmN1clNyYyB8fCBzcmM7XG5cdH1cblxuXHQvLyBzdG9yZSBpbmZvIG9uIG9iamVjdCBmb3IgbGF0ZXIgdXNlXG5cdGlmIChlbFvgsqBdLnMpIHtcblx0XHRlbFvgsqBdLnMgPSBzcmM7XG5cdFx0aWYgKHJlcXVlc3RlZFNyYykge1xuXHRcdFx0Ly8gdGhlIGF0dHJpYnV0ZSByZWZsZWN0cyB0aGUgdXNlciBpbnB1dFxuXHRcdFx0Ly8gdGhlIHByb3BlcnR5IGlzIHRoZSByZXNvbHZlZCBVUkxcblx0XHRcdGVsW+CyoF0uc3JjQXR0ciA9IHJlcXVlc3RlZFNyYztcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0ZWxb4LKgXSA9IHtcblx0XHRcdHM6IHNyYyxcblx0XHRcdHNyY0F0dHI6IHJlcXVlc3RlZFNyYyB8fCBuYXRpdmVHZXRBdHRyaWJ1dGUuY2FsbChlbCwgJ3NyYycpLFxuXHRcdFx0c3Jjc2V0QXR0cjogZWwuc3Jjc2V0XG5cdFx0fTtcblx0XHRlbC5zcmMgPSDgsqA7XG5cblx0XHQvLyByZW1vdmUgc3Jjc2V0IGJlY2F1c2UgaXQgb3ZlcnJpZGVzIHNyY1xuXHRcdGlmIChlbC5zcmNzZXQpIHtcblx0XHRcdGVsLnNyY3NldCA9ICcnO1xuXG5cdFx0XHQvLyByZXN0b3JlIG5vbi1icm93c2VyLXJlYWRhYmxlIHNyY3NldCBwcm9wZXJ0eVxuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGVsLCAnc3Jjc2V0Jywge1xuXHRcdFx0XHR2YWx1ZTogZWxb4LKgXS5zcmNzZXRBdHRyXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRrZWVwU3JjVXNhYmxlKGVsKTtcblx0fVxuXG5cdGVsLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICd1cmwoXCInICsgc3JjICsgJ1wiKSc7XG5cdGVsLnN0eWxlLmJhY2tncm91bmRQb3NpdGlvbiA9IHN0eWxlWydvYmplY3QtcG9zaXRpb24nXSB8fCAnY2VudGVyJztcblx0ZWwuc3R5bGUuYmFja2dyb3VuZFJlcGVhdCA9ICduby1yZXBlYXQnO1xuXG5cdGlmICgvc2NhbGUtZG93bi8udGVzdChzdHlsZVsnb2JqZWN0LWZpdCddKSkge1xuXHRcdC8vIGBvYmplY3QtZml0OiBzY2FsZS1kb3duYCBpcyBlaXRoZXIgYGNvbnRhaW5gIG9yIGBhdXRvYFxuXHRcdGlmICghZWxb4LKgXS5pKSB7XG5cdFx0XHRlbFvgsqBdLmkgPSBuZXcgSW1hZ2UoKTtcblx0XHRcdGVsW+CyoF0uaS5zcmMgPSBzcmM7XG5cdFx0fVxuXG5cdFx0Ly8gbmF0dXJhbFdpZHRoIGlzIG9ubHkgYXZhaWxhYmxlIHdoZW4gdGhlIGltYWdlIGhlYWRlcnMgYXJlIGxvYWRlZCxcblx0XHQvLyB0aGlzIGxvb3Agd2lsbCBwb2xsIGl0IGV2ZXJ5IDEwMG1zLlxuXHRcdC8vIFRoZXJlJ3MgY3VycmVudGx5IG5vIGNoZWNrIHRvIHByZXZlbnQgdGhpcyBsb29wIGZyb20gc3RhcnRpbmcgdHdpY2Vcblx0XHQvLyBhcyBhIGNvbnNlcXVlbmNlIG9mIGNhbGxpbmcgb2ZpKCkgdHdpY2Ugb24gdGhlIHNhbWUgaW1hZ2UsIGJ1dCBpdCdzIGxpZ2h0XG5cdFx0Ly8gYW5kIGNhdXNlcyBubyBpc3N1ZXMsIHNvIGl0J3Mgbm90IHdvcnRoIGVuc3VyaW5nIHRoYXQgaXQgZG9lc24ndC5cblx0XHQoZnVuY3Rpb24gbG9vcCgpIHtcblx0XHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTQ5NTkwOFxuXHRcdFx0aWYgKGVsW+CyoF0uaS5uYXR1cmFsV2lkdGgpIHtcblx0XHRcdFx0aWYgKGVsW+CyoF0uaS5uYXR1cmFsV2lkdGggPiBlbC53aWR0aCB8fCBlbFvgsqBdLmkubmF0dXJhbEhlaWdodCA+IGVsLmhlaWdodCkge1xuXHRcdFx0XHRcdGVsLnN0eWxlLmJhY2tncm91bmRTaXplID0gJ2NvbnRhaW4nO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGVsLnN0eWxlLmJhY2tncm91bmRTaXplID0gJ2F1dG8nO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdHNldFRpbWVvdXQobG9vcCwgMTAwKTtcblx0XHR9KSgpO1xuXHR9IGVsc2Uge1xuXHRcdGVsLnN0eWxlLmJhY2tncm91bmRTaXplID0gc3R5bGVbJ29iamVjdC1maXQnXS5yZXBsYWNlKCdub25lJywgJ2F1dG8nKS5yZXBsYWNlKCdmaWxsJywgJzEwMCUgMTAwJScpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGtlZXBTcmNVc2FibGUoZWwpIHtcblx0dmFyIGRlc2NyaXB0b3JzID0ge1xuXHRcdGdldDogZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGVsW+CyoF0ucztcblx0XHR9LFxuXHRcdHNldDogZnVuY3Rpb24gKHNyYykge1xuXHRcdFx0ZGVsZXRlIGVsW+CyoF0uaTsgLy8gc2NhbGUtZG93bidzIGltZyBzaXplcyBuZWVkIHRvIGJlIHVwZGF0ZWQgdG9vXG5cdFx0XHRmaXhPbmUoZWwsIHNyYyk7XG5cdFx0XHRyZXR1cm4gc3JjO1xuXHRcdH1cblx0fTtcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGVsLCAnc3JjJywgZGVzY3JpcHRvcnMpO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZWwsICdjdXJyZW50U3JjJywgeyBnZXQ6IGRlc2NyaXB0b3JzLmdldCB9KTsgLy8gaXQgc2hvdWxkIGJlIHJlYWQtb25seVxufVxuXG5mdW5jdGlvbiBoaWphY2tBdHRyaWJ1dGVzKCkge1xuXHRpZiAoIXN1cHBvcnRzT2JqZWN0UG9zaXRpb24pIHtcblx0XHRIVE1MSW1hZ2VFbGVtZW50LnByb3RvdHlwZS5nZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbiAobmFtZSkge1xuXHRcdFx0aWYgKHRoaXNb4LKgXSAmJiAobmFtZSA9PT0gJ3NyYycgfHwgbmFtZSA9PT0gJ3NyY3NldCcpKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzW+CyoF1bbmFtZSArICdBdHRyJ107XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbmF0aXZlR2V0QXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSk7XG5cdFx0fTtcblxuXHRcdEhUTUxJbWFnZUVsZW1lbnQucHJvdG90eXBlLnNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuXHRcdFx0aWYgKHRoaXNb4LKgXSAmJiAobmFtZSA9PT0gJ3NyYycgfHwgbmFtZSA9PT0gJ3NyY3NldCcpKSB7XG5cdFx0XHRcdHRoaXNbbmFtZSA9PT0gJ3NyYycgPyAnc3JjJyA6IG5hbWUgKyAnQXR0ciddID0gU3RyaW5nKHZhbHVlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG5hdGl2ZVNldEF0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUsIHZhbHVlKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG59XG5cbmZ1bmN0aW9uIGZpeChpbWdzLCBvcHRzKSB7XG5cdHZhciBzdGFydEF1dG9Nb2RlID0gIWF1dG9Nb2RlRW5hYmxlZCAmJiAhaW1ncztcblx0b3B0cyA9IG9wdHMgfHwge307XG5cdGltZ3MgPSBpbWdzIHx8ICdpbWcnO1xuXHRpZiAoc3VwcG9ydHNPYmplY3RQb3NpdGlvbiAmJiAhb3B0cy5za2lwVGVzdCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIHVzZSBpbWdzIGFzIGEgc2VsZWN0b3Igb3IganVzdCBzZWxlY3QgYWxsIGltYWdlc1xuXHRpZiAodHlwZW9mIGltZ3MgPT09ICdzdHJpbmcnKSB7XG5cdFx0aW1ncyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZycpO1xuXHR9IGVsc2UgaWYgKCFpbWdzLmxlbmd0aCkge1xuXHRcdGltZ3MgPSBbaW1nc107XG5cdH1cblxuXHQvLyBhcHBseSBmaXggdG8gYWxsXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgaW1ncy5sZW5ndGg7IGkrKykge1xuXHRcdGltZ3NbaV1b4LKgXSA9IGltZ3NbaV1b4LKgXSB8fCBvcHRzO1xuXHRcdGZpeE9uZShpbWdzW2ldKTtcblx0fVxuXG5cdGlmIChzdGFydEF1dG9Nb2RlKSB7XG5cdFx0ZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdGlmIChlLnRhcmdldC50YWdOYW1lID09PSAnSU1HJykge1xuXHRcdFx0XHRmaXgoZS50YXJnZXQsIHtcblx0XHRcdFx0XHRza2lwVGVzdDogb3B0cy5za2lwVGVzdFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9LCB0cnVlKTtcblx0XHRhdXRvTW9kZUVuYWJsZWQgPSB0cnVlO1xuXHRcdGltZ3MgPSAnaW1nJzsgLy8gcmVzZXQgdG8gYSBnZW5lcmljIHNlbGVjdG9yIGZvciB3YXRjaE1RXG5cdH1cblxuXHQvLyBpZiByZXF1ZXN0ZWQsIHdhdGNoIG1lZGlhIHF1ZXJpZXMgZm9yIG9iamVjdC1maXQgY2hhbmdlXG5cdGlmIChvcHRzLndhdGNoTVEpIHtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgZml4LmJpbmQobnVsbCwgaW1ncywge1xuXHRcdFx0c2tpcFRlc3Q6IG9wdHMuc2tpcFRlc3Rcblx0XHR9KSk7XG5cdH1cbn1cblxuZml4LnN1cHBvcnRzT2JqZWN0Rml0ID0gc3VwcG9ydHNPYmplY3RGaXQ7XG5maXguc3VwcG9ydHNPYmplY3RQb3NpdGlvbiA9IHN1cHBvcnRzT2JqZWN0UG9zaXRpb247XG5cbmhpamFja0F0dHJpYnV0ZXMoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmaXg7IiwidmFyIHNsaWRlc2hvd3MgPSByZXF1aXJlKFwiLi9zbGlkZXNob3cuanNcIik7XHJcbnNsaWRlc2hvd3MuaW5pdCgpO1xyXG5cclxucmVxdWlyZShcIm9iamVjdC1maXQtaW1hZ2VzXCIpKCk7IiwibW9kdWxlLmV4cG9ydHMgPSBTbGlkZXNob3dNb2RhbDtcclxuXHJcbnZhciBLRVlfQ09ERVMgPSB7XHJcbiAgICBMRUZUX0FSUk9XOiAzNyxcclxuICAgIFJJR0hUX0FSUk9XOiAzOSxcclxuICAgIEVTQ0FQRTogMjdcclxufTtcclxuXHJcbmZ1bmN0aW9uIFNsaWRlc2hvd01vZGFsKCRjb250YWluZXIsIHNsaWRlc2hvdykge1xyXG4gICAgdGhpcy5fc2xpZGVzaG93ID0gc2xpZGVzaG93O1xyXG5cclxuICAgIHRoaXMuXyRtb2RhbCA9ICRjb250YWluZXIuZmluZChcIi5zbGlkZXNob3ctbW9kYWxcIik7XHJcbiAgICB0aGlzLl8kb3ZlcmxheSA9IHRoaXMuXyRtb2RhbC5maW5kKFwiLm1vZGFsLW92ZXJsYXlcIik7XHJcbiAgICB0aGlzLl8kY29udGVudCA9IHRoaXMuXyRtb2RhbC5maW5kKFwiLm1vZGFsLWNvbnRlbnRzXCIpO1xyXG4gICAgdGhpcy5fJGNhcHRpb24gPSB0aGlzLl8kbW9kYWwuZmluZChcIi5tb2RhbC1jYXB0aW9uXCIpO1xyXG4gICAgdGhpcy5fJGltYWdlQ29udGFpbmVyID0gdGhpcy5fJG1vZGFsLmZpbmQoXCIubW9kYWwtaW1hZ2VcIik7XHJcbiAgICB0aGlzLl8kaW1hZ2VMZWZ0ID0gdGhpcy5fJG1vZGFsLmZpbmQoXCIuaW1hZ2UtYWR2YW5jZS1sZWZ0XCIpO1xyXG4gICAgdGhpcy5fJGltYWdlUmlnaHQgPSB0aGlzLl8kbW9kYWwuZmluZChcIi5pbWFnZS1hZHZhbmNlLXJpZ2h0XCIpO1xyXG5cclxuICAgIHRoaXMuX2luZGV4ID0gMDsgLy8gSW5kZXggb2Ygc2VsZWN0ZWQgaW1hZ2VcclxuICAgIHRoaXMuX2lzT3BlbiA9IGZhbHNlO1xyXG4gICAgXHJcbiAgICB0aGlzLl8kaW1hZ2VMZWZ0Lm9uKFwiY2xpY2tcIiwgdGhpcy5hZHZhbmNlTGVmdC5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuXyRpbWFnZVJpZ2h0Lm9uKFwiY2xpY2tcIiwgdGhpcy5hZHZhbmNlUmlnaHQuYmluZCh0aGlzKSk7XHJcbiAgICAkKGRvY3VtZW50KS5vbihcImtleWRvd25cIiwgdGhpcy5fb25LZXlEb3duLmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8vIEdpdmUgalF1ZXJ5IGNvbnRyb2wgb3ZlciBzaG93aW5nL2hpZGluZ1xyXG4gICAgdGhpcy5fJG1vZGFsLmNzcyhcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcclxuICAgIHRoaXMuXyRtb2RhbC5oaWRlKCk7XHJcblxyXG4gICAgLy8gRXZlbnRzXHJcbiAgICAkKHdpbmRvdykub24oXCJyZXNpemVcIiwgdGhpcy5fb25SZXNpemUuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLl8kb3ZlcmxheS5vbihcImNsaWNrXCIsIHRoaXMuY2xvc2UuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLl8kbW9kYWwuZmluZChcIi5tb2RhbC1jbG9zZVwiKS5vbihcImNsaWNrXCIsIHRoaXMuY2xvc2UuYmluZCh0aGlzKSk7XHJcbiAgICBcclxuICAgIHRoaXMuX3VwZGF0ZUNvbnRyb2xzKCk7XHJcblxyXG4gICAgLy8gU2l6ZSBvZiBmb250YXdlc29tZSBpY29ucyBuZWVkcyBhIHNsaWdodCBkZWxheSAodW50aWwgc3RhY2sgaXMgY2xlYXIpIGZvclxyXG4gICAgLy8gc29tZSByZWFzb25cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuX29uUmVzaXplKCk7XHJcbiAgICB9LmJpbmQodGhpcyksIDApO1xyXG59XHJcblxyXG5TbGlkZXNob3dNb2RhbC5wcm90b3R5cGUuYWR2YW5jZUxlZnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLnNob3dJbWFnZUF0KHRoaXMuX2luZGV4IC0gMSk7XHJcbn07XHJcblxyXG5TbGlkZXNob3dNb2RhbC5wcm90b3R5cGUuYWR2YW5jZVJpZ2h0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zaG93SW1hZ2VBdCh0aGlzLl9pbmRleCArIDEpO1xyXG59O1xyXG5cclxuU2xpZGVzaG93TW9kYWwucHJvdG90eXBlLnNob3dJbWFnZUF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICBpbmRleCA9IE1hdGgubWF4KGluZGV4LCAwKTtcclxuICAgIGluZGV4ID0gTWF0aC5taW4oaW5kZXgsIHRoaXMuX3NsaWRlc2hvdy5nZXROdW1JbWFnZXMoKSAtIDEpO1xyXG4gICAgdGhpcy5faW5kZXggPSBpbmRleDtcclxuICAgIHZhciAkaW1nID0gdGhpcy5fc2xpZGVzaG93LmdldEdhbGxlcnlJbWFnZSh0aGlzLl9pbmRleCk7XHJcbiAgICB2YXIgY2FwdGlvbiA9IHRoaXMuX3NsaWRlc2hvdy5nZXRDYXB0aW9uKHRoaXMuX2luZGV4KTtcclxuXHJcbiAgICB0aGlzLl8kaW1hZ2VDb250YWluZXIuZW1wdHkoKTtcclxuICAgICQoXCI8aW1nPlwiLCB7c3JjOiAkaW1nLmF0dHIoXCJzcmNcIil9KVxyXG4gICAgICAgIC5hcHBlbmRUbyh0aGlzLl8kaW1hZ2VDb250YWluZXIpO1xyXG5cclxuICAgIHRoaXMuXyRjYXB0aW9uLmVtcHR5KCk7XHJcbiAgICBpZiAoY2FwdGlvbikge1xyXG4gICAgICAgICQoXCI8c3Bhbj5cIikuYWRkQ2xhc3MoXCJmaWd1cmUtbnVtYmVyXCIpXHJcbiAgICAgICAgICAgIC50ZXh0KFwiRmlnLiBcIiArICh0aGlzLl9pbmRleCArIDEpICsgXCI6IFwiKVxyXG4gICAgICAgICAgICAuYXBwZW5kVG8odGhpcy5fJGNhcHRpb24pO1xyXG4gICAgICAgICQoXCI8c3Bhbj5cIikuYWRkQ2xhc3MoXCJjYXB0aW9uLXRleHRcIilcclxuICAgICAgICAgICAgLnRleHQoY2FwdGlvbilcclxuICAgICAgICAgICAgLmFwcGVuZFRvKHRoaXMuXyRjYXB0aW9uKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdGhpcy5fb25SZXNpemUoKTtcclxuICAgIHRoaXMuX3VwZGF0ZUNvbnRyb2xzKCk7XHJcbn07XHJcblxyXG5TbGlkZXNob3dNb2RhbC5wcm90b3R5cGUub3BlbiA9IGZ1bmN0aW9uIChpbmRleCkge1xyXG4gICAgaW5kZXggPSBpbmRleCB8fCAwO1xyXG4gICAgdGhpcy5fJG1vZGFsLnNob3coKTtcclxuICAgIHRoaXMuc2hvd0ltYWdlQXQoaW5kZXgpO1xyXG4gICAgdGhpcy5faXNPcGVuID0gdHJ1ZTtcclxufTtcclxuXHJcblNsaWRlc2hvd01vZGFsLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuXyRtb2RhbC5oaWRlKCk7XHJcbiAgICB0aGlzLl9pc09wZW4gPSBmYWxzZTtcclxufTtcclxuXHJcblNsaWRlc2hvd01vZGFsLnByb3RvdHlwZS5fb25LZXlEb3duID0gZnVuY3Rpb24gKGUpIHtcclxuICAgIGlmICghdGhpcy5faXNPcGVuKSByZXR1cm47XHJcbiAgICBpZiAoZS53aGljaCA9PT0gS0VZX0NPREVTLkxFRlRfQVJST1cpIHtcclxuICAgICAgICB0aGlzLmFkdmFuY2VMZWZ0KCk7XHJcbiAgICB9IGVsc2UgaWYgKGUud2hpY2ggPT09IEtFWV9DT0RFUy5SSUdIVF9BUlJPVykge1xyXG4gICAgICAgIHRoaXMuYWR2YW5jZVJpZ2h0KCk7XHJcbiAgICB9IGVsc2UgaWYgKGUud2hpY2ggPT09IEtFWV9DT0RFUy5FU0NBUEUpIHtcclxuICAgICAgICB0aGlzLmNsb3NlKCk7ICAgXHJcbiAgICB9XHJcbn07XHJcblxyXG5TbGlkZXNob3dNb2RhbC5wcm90b3R5cGUuX3VwZGF0ZUNvbnRyb2xzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gUmUtZW5hYmxlXHJcbiAgICB0aGlzLl8kaW1hZ2VSaWdodC5yZW1vdmVDbGFzcyhcImRpc2FibGVkXCIpO1xyXG4gICAgdGhpcy5fJGltYWdlTGVmdC5yZW1vdmVDbGFzcyhcImRpc2FibGVkXCIpO1xyXG4gICAgXHJcbiAgICAvLyBEaXNhYmxlIGlmIHdlJ3ZlIHJlYWNoZWQgdGhlIHRoZSBtYXggb3IgbWluIGxpbWl0XHJcbiAgICBpZiAodGhpcy5faW5kZXggPj0gKHRoaXMuX3NsaWRlc2hvdy5nZXROdW1JbWFnZXMoKSAtIDEpKSB7XHJcbiAgICAgICAgdGhpcy5fJGltYWdlUmlnaHQuYWRkQ2xhc3MoXCJkaXNhYmxlZFwiKTtcclxuICAgIH0gZWxzZSBpZiAodGhpcy5faW5kZXggPD0gMCkge1xyXG4gICAgICAgIHRoaXMuXyRpbWFnZUxlZnQuYWRkQ2xhc3MoXCJkaXNhYmxlZFwiKTtcclxuICAgIH1cclxufTtcclxuXHJcblNsaWRlc2hvd01vZGFsLnByb3RvdHlwZS5fb25SZXNpemUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgJGltYWdlID0gdGhpcy5fJGltYWdlQ29udGFpbmVyLmZpbmQoXCJpbWdcIik7XHJcblxyXG4gICAgLy8gUmVzZXQgdGhlIGNvbnRlbnQncyB3aWR0aFxyXG4gICAgdGhpcy5fJGNvbnRlbnQud2lkdGgoXCJcIik7XHJcblxyXG4gICAgLy8gRmluZCB0aGUgc2l6ZSBvZiB0aGUgY29tcG9uZW50cyB0aGF0IG5lZWQgdG8gYmUgZGlzcGxheWVkIGluIGFkZGl0aW9uIHRvIFxyXG4gICAgLy8gdGhlIGltYWdlXHJcbiAgICB2YXIgY29udHJvbHNXaWR0aCA9IHRoaXMuXyRpbWFnZUxlZnQub3V0ZXJXaWR0aCh0cnVlKSArIFxyXG4gICAgICAgIHRoaXMuXyRpbWFnZVJpZ2h0Lm91dGVyV2lkdGgodHJ1ZSk7XHJcbiAgICAvLyBIYWNrIGZvciBub3cgLSBidWRnZXQgZm9yIDJ4IHRoZSBjYXB0aW9uIGhlaWdodC4gXHJcbiAgICB2YXIgY2FwdGlvbkhlaWdodCA9IDIgKiB0aGlzLl8kY2FwdGlvbi5vdXRlckhlaWdodCh0cnVlKTsgXHJcbiAgICB2YXIgaW1hZ2VQYWRkaW5nID0gJGltYWdlLmlubmVyV2lkdGgoKTtcclxuXHJcbiAgICAvLyBDYWxjdWxhdGUgdGhlIGF2YWlsYWJsZSBhcmVhIGZvciB0aGUgbW9kYWxcclxuICAgIHZhciBtdyA9IHRoaXMuXyRtb2RhbC53aWR0aCgpIC0gY29udHJvbHNXaWR0aDtcclxuICAgIHZhciBtaCA9IHRoaXMuXyRtb2RhbC5oZWlnaHQoKSAtIGNhcHRpb25IZWlnaHQ7XHJcblxyXG4gICAgLy8gRml0IHRoZSBpbWFnZSB0byB0aGUgcmVtYWluaW5nIHNjcmVlbiByZWFsIGVzdGF0ZSBcclxuICAgIHZhciBzZXRTaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBpdyA9ICRpbWFnZS5wcm9wKFwibmF0dXJhbFdpZHRoXCIpO1xyXG4gICAgICAgIHZhciBpaCA9ICRpbWFnZS5wcm9wKFwibmF0dXJhbEhlaWdodFwiKTtcclxuICAgICAgICB2YXIgc3cgPSBpdyAvIG13O1xyXG4gICAgICAgIHZhciBzaCA9IGloIC8gbWg7XHJcbiAgICAgICAgdmFyIHMgPSBNYXRoLm1heChzdywgc2gpO1xyXG5cclxuICAgICAgICAvLyBTZXQgd2lkdGgvaGVpZ2h0IHVzaW5nIENTUyBpbiBvcmRlciB0byByZXNwZWN0IGJveC1zaXppbmdcclxuICAgICAgICBpZiAocyA+IDEpIHtcclxuICAgICAgICAgICAgJGltYWdlLmNzcyhcIndpZHRoXCIsIGl3IC8gcyArIFwicHhcIik7XHJcbiAgICAgICAgICAgICRpbWFnZS5jc3MoXCJoZWlnaHRcIiwgaWggLyBzICsgXCJweFwiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkaW1hZ2UuY3NzKFwid2lkdGhcIiwgaXcgKyBcInB4XCIpO1xyXG4gICAgICAgICAgICAkaW1hZ2UuY3NzKFwiaGVpZ2h0XCIsIGloICsgXCJweFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuXyRpbWFnZVJpZ2h0LmNzcyhcInRvcFwiLCAkaW1hZ2Uub3V0ZXJIZWlnaHQoKSAvIDIgKyBcInB4XCIpO1xyXG4gICAgICAgIHRoaXMuXyRpbWFnZUxlZnQuY3NzKFwidG9wXCIsICRpbWFnZS5vdXRlckhlaWdodCgpIC8gMiArIFwicHhcIik7XHJcblxyXG4gICAgICAgIC8vIFNldCB0aGUgY29udGVudCB3cmFwcGVyIHRvIGJlIHRoZSB3aWR0aCBvZiB0aGUgaW1hZ2UuIFRoaXMgd2lsbCBrZWVwIFxyXG4gICAgICAgIC8vIHRoZSBjYXB0aW9uIGZyb20gZXhwYW5kaW5nIGJleW9uZCB0aGUgaW1hZ2UuXHJcbiAgICAgICAgdGhpcy5fJGNvbnRlbnQud2lkdGgoJGltYWdlLm91dGVyV2lkdGgodHJ1ZSkpOyAgICAgICAgXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcblxyXG4gICAgaWYgKCRpbWFnZS5wcm9wKFwiY29tcGxldGVcIikpIHNldFNpemUoKTtcclxuICAgIGVsc2UgJGltYWdlLm9uZShcImxvYWRcIiwgc2V0U2l6ZSk7XHJcbn07XHJcbiIsInZhciBTbGlkZXNob3dNb2RhbCA9IHJlcXVpcmUoXCIuL3NsaWRlc2hvdy1tb2RhbC5qc1wiKTtcclxudmFyIFRodW1ibmFpbFNsaWRlciA9IHJlcXVpcmUoXCIuL3RodW1ibmFpbC1zbGlkZXIuanNcIik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGluaXQ6IGZ1bmN0aW9uKHRyYW5zaXRpb25EdXJhdGlvbikge1xyXG4gICAgICAgIHRyYW5zaXRpb25EdXJhdGlvbiA9ICh0cmFuc2l0aW9uRHVyYXRpb24gIT09IHVuZGVmaW5lZCkgP1xyXG4gICAgICAgICAgICB0cmFuc2l0aW9uRHVyYXRpb24gOiA0MDA7XHJcbiAgICAgICAgdGhpcy5fc2xpZGVzaG93cyA9IFtdO1xyXG4gICAgICAgICQoXCIuc2xpZGVzaG93XCIpLmVhY2goZnVuY3Rpb24gKGluZGV4LCBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHZhciBzbGlkZXNob3cgPSBuZXcgU2xpZGVzaG93KCQoZWxlbWVudCksIHRyYW5zaXRpb25EdXJhdGlvbik7XHJcbiAgICAgICAgICAgIHRoaXMuX3NsaWRlc2hvd3MucHVzaChzbGlkZXNob3cpO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBTbGlkZXNob3coJGNvbnRhaW5lciwgdHJhbnNpdGlvbkR1cmF0aW9uKSB7XHJcbiAgICB0aGlzLl90cmFuc2l0aW9uRHVyYXRpb24gPSB0cmFuc2l0aW9uRHVyYXRpb247XHJcbiAgICB0aGlzLl8kY29udGFpbmVyID0gJGNvbnRhaW5lcjtcclxuICAgIHRoaXMuX2luZGV4ID0gMDsgLy8gSW5kZXggb2Ygc2VsZWN0ZWQgaW1hZ2VcclxuXHJcbiAgICAvLyBDcmVhdGUgY29tcG9uZW50c1xyXG4gICAgdGhpcy5fdGh1bWJuYWlsU2xpZGVyID0gbmV3IFRodW1ibmFpbFNsaWRlcigkY29udGFpbmVyLCB0aGlzKTtcclxuICAgIHRoaXMuX21vZGFsID0gbmV3IFNsaWRlc2hvd01vZGFsKCRjb250YWluZXIsIHRoaXMpO1xyXG5cclxuICAgIC8vIENhY2hlIGFuZCBjcmVhdGUgbmVjZXNzYXJ5IERPTSBlbGVtZW50cyAgIFxyXG4gICAgdGhpcy5fJGNhcHRpb25Db250YWluZXIgPSAkY29udGFpbmVyLmZpbmQoXCIuY2FwdGlvblwiKTtcclxuICAgIHRoaXMuXyRzZWxlY3RlZEltYWdlQ29udGFpbmVyID0gJGNvbnRhaW5lci5maW5kKFwiLnNlbGVjdGVkLWltYWdlXCIpO1xyXG5cclxuICAgIC8vIE9wZW4gbW9kYWwgb24gY2xpY2tpbmcgc2VsZWN0ZWQgaW1hZ2VcclxuICAgIHRoaXMuXyRzZWxlY3RlZEltYWdlQ29udGFpbmVyLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuX21vZGFsLm9wZW4odGhpcy5faW5kZXgpOyAgICBcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLy8gTG9hZCBpbWFnZXNcclxuICAgIHRoaXMuXyRnYWxsZXJ5SW1hZ2VzID0gdGhpcy5fbG9hZEdhbGxlcnlJbWFnZXMoKTtcclxuICAgIHRoaXMuX251bUltYWdlcyA9IHRoaXMuXyRnYWxsZXJ5SW1hZ2VzLmxlbmd0aDtcclxuXHJcbiAgICAvLyBTaG93IHRoZSBmaXJzdCBpbWFnZVxyXG4gICAgdGhpcy5zaG93SW1hZ2UoMCk7XHJcbn1cclxuXHJcblNsaWRlc2hvdy5wcm90b3R5cGUuZ2V0QWN0aXZlSW5kZXggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5faW5kZXg7XHJcbn07XHJcblxyXG5TbGlkZXNob3cucHJvdG90eXBlLmdldE51bUltYWdlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLl9udW1JbWFnZXM7XHJcbn07XHJcblxyXG5TbGlkZXNob3cucHJvdG90eXBlLmdldEdhbGxlcnlJbWFnZSA9IGZ1bmN0aW9uIChpbmRleCkge1xyXG4gICAgcmV0dXJuIHRoaXMuXyRnYWxsZXJ5SW1hZ2VzW2luZGV4XTtcclxufTtcclxuXHJcblNsaWRlc2hvdy5wcm90b3R5cGUuZ2V0Q2FwdGlvbiA9IGZ1bmN0aW9uIChpbmRleCkge1xyXG4gICAgcmV0dXJuIHRoaXMuXyRnYWxsZXJ5SW1hZ2VzW2luZGV4XS5kYXRhKFwiY2FwdGlvblwiKTtcclxufTtcclxuXHJcblNsaWRlc2hvdy5wcm90b3R5cGUuc2hvd0ltYWdlID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAvLyBSZXNldCBhbGwgaW1hZ2VzIHRvIGludmlzaWJsZSBhbmQgbG93ZXN0IHotaW5kZXguIFRoaXMgY291bGQgYmUgc21hcnRlcixcclxuICAgIC8vIGxpa2UgSG92ZXJTbGlkZXNob3csIGFuZCBvbmx5IHJlc2V0IGV4YWN0bHkgd2hhdCB3ZSBuZWVkLCBidXQgd2UgYXJlbid0IFxyXG4gICAgLy8gd2FzdGluZyB0aGF0IG1hbnkgY3ljbGVzLlxyXG4gICAgdGhpcy5fJGdhbGxlcnlJbWFnZXMuZm9yRWFjaChmdW5jdGlvbiAoJGdhbGxlcnlJbWFnZSkge1xyXG4gICAgICAgICRnYWxsZXJ5SW1hZ2UuY3NzKHtcclxuICAgICAgICAgICAgXCJ6SW5kZXhcIjogMCxcclxuICAgICAgICAgICAgXCJvcGFjaXR5XCI6IDBcclxuICAgICAgICB9KTtcclxuICAgICAgICAkZ2FsbGVyeUltYWdlLnZlbG9jaXR5KFwic3RvcFwiKTsgLy8gU3RvcCBhbnkgYW5pbWF0aW9uc1xyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgLy8gQ2FjaGUgcmVmZXJlbmNlcyB0byB0aGUgbGFzdCBhbmQgY3VycmVudCBpbWFnZVxyXG4gICAgdmFyICRsYXN0SW1hZ2UgPSB0aGlzLl8kZ2FsbGVyeUltYWdlc1t0aGlzLl9pbmRleF07XHJcbiAgICB2YXIgJGN1cnJlbnRJbWFnZSA9IHRoaXMuXyRnYWxsZXJ5SW1hZ2VzW2luZGV4XTtcclxuICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XHJcblxyXG4gICAgLy8gTWFrZSB0aGUgbGFzdCBpbWFnZSB2aXNpc2JsZSBhbmQgdGhlbiBhbmltYXRlIHRoZSBjdXJyZW50IGltYWdlIGludG8gdmlld1xyXG4gICAgLy8gb24gdG9wIG9mIHRoZSBsYXN0XHJcbiAgICAkbGFzdEltYWdlLmNzcyhcInpJbmRleFwiLCAxKTtcclxuICAgICRjdXJyZW50SW1hZ2UuY3NzKFwiekluZGV4XCIsIDIpO1xyXG4gICAgJGxhc3RJbWFnZS5jc3MoXCJvcGFjaXR5XCIsIDEpO1xyXG4gICAgJGN1cnJlbnRJbWFnZS52ZWxvY2l0eSh7XCJvcGFjaXR5XCI6IDF9LCB0aGlzLl90cmFuc2l0aW9uRHVyYXRpb24sIFxyXG4gICAgICAgIFwiZWFzZUluT3V0UXVhZFwiKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgdGhlIGNhcHRpb24sIGlmIGl0IGV4aXN0cyBvbiB0aGUgdGh1bWJuYWlsXHJcbiAgICB2YXIgY2FwdGlvbiA9ICRjdXJyZW50SW1hZ2UuZGF0YShcImNhcHRpb25cIik7XHJcbiAgICBpZiAoY2FwdGlvbikge1xyXG4gICAgICAgIHRoaXMuXyRjYXB0aW9uQ29udGFpbmVyLmVtcHR5KCk7XHJcbiAgICAgICAgJChcIjxzcGFuPlwiKS5hZGRDbGFzcyhcImZpZ3VyZS1udW1iZXJcIilcclxuICAgICAgICAgICAgLnRleHQoXCJGaWcuIFwiICsgKHRoaXMuX2luZGV4ICsgMSkgKyBcIjogXCIpXHJcbiAgICAgICAgICAgIC5hcHBlbmRUbyh0aGlzLl8kY2FwdGlvbkNvbnRhaW5lcik7XHJcbiAgICAgICAgJChcIjxzcGFuPlwiKS5hZGRDbGFzcyhcImNhcHRpb24tdGV4dFwiKVxyXG4gICAgICAgICAgICAudGV4dChjYXB0aW9uKVxyXG4gICAgICAgICAgICAuYXBwZW5kVG8odGhpcy5fJGNhcHRpb25Db250YWluZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE9iamVjdCBpbWFnZSBmaXQgcG9seWZpbGwgYnJlYWtzIGpRdWVyeSBhdHRyKC4uLiksIHNvIGZhbGxiYWNrIHRvIGp1c3QgXHJcbiAgICAvLyB1c2luZyBlbGVtZW50LnNyY1xyXG4gICAgLy8gVE9ETzogTGF6eSFcclxuICAgIC8vIGlmICgkY3VycmVudEltYWdlLmdldCgwKS5zcmMgPT09IFwiXCIpIHtcclxuICAgIC8vICAgICAkY3VycmVudEltYWdlLmdldCgwKS5zcmMgPSAkY3VycmVudEltYWdlLmRhdGEoXCJpbWFnZS11cmxcIik7XHJcbiAgICAvLyB9XHJcbn07XHJcblxyXG5TbGlkZXNob3cucHJvdG90eXBlLl9sb2FkR2FsbGVyeUltYWdlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIENyZWF0ZSBlbXB0eSBpbWFnZXMgaW4gdGhlIGdhbGxlcnkgZm9yIGVhY2ggdGh1bWJuYWlsLiBUaGlzIGhlbHBzIHVzIGRvXHJcbiAgICAvLyBsYXp5IGxvYWRpbmcgb2YgZ2FsbGVyeSBpbWFnZXMgYW5kIGFsbG93cyB1cyB0byBjcm9zcy1mYWRlIGltYWdlcy5cclxuICAgIHZhciAkZ2FsbGVyeUltYWdlcyA9IFtdO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl90aHVtYm5haWxTbGlkZXIuZ2V0TnVtVGh1bWJuYWlscygpOyBpICs9IDEpIHtcclxuICAgICAgICAvLyBHZXQgdGhlIHRodW1ibmFpbCBlbGVtZW50IHdoaWNoIGhhcyBwYXRoIGFuZCBjYXB0aW9uIGRhdGFcclxuICAgICAgICB2YXIgJHRodW1iID0gdGhpcy5fdGh1bWJuYWlsU2xpZGVyLmdldCRUaHVtYm5haWwoaSk7XHJcblxyXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgaWQgZnJvbSB0aGUgcGF0aCB0byB0aGUgbGFyZ2UgaW1hZ2VcclxuICAgICAgICB2YXIgbGFyZ2VQYXRoID0gJHRodW1iLmRhdGEoXCJsYXJnZS1wYXRoXCIpO1xyXG4gICAgICAgIHZhciBpZCA9IGxhcmdlUGF0aC5zcGxpdChcIi9cIikucG9wKCkuc3BsaXQoXCIuXCIpWzBdO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgYSBnYWxsZXJ5IGltYWdlIGVsZW1lbnRcclxuICAgICAgICB2YXIgJGdhbGxlcnlJbWFnZSA9ICQoXCI8aW1nPlwiLCB7aWQ6IGlkfSlcclxuICAgICAgICAgICAgLmNzcyh7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxyXG4gICAgICAgICAgICAgICAgdG9wOiBcIjBweFwiLFxyXG4gICAgICAgICAgICAgICAgbGVmdDogXCIwcHhcIixcclxuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAsXHJcbiAgICAgICAgICAgICAgICB6SW5kZXg6IDBcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmRhdGEoXCJpbWFnZS11cmxcIiwgbGFyZ2VQYXRoKSAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAuZGF0YShcImNhcHRpb25cIiwgJHRodW1iLmRhdGEoXCJjYXB0aW9uXCIpKVxyXG4gICAgICAgICAgICAuYXBwZW5kVG8odGhpcy5fJHNlbGVjdGVkSW1hZ2VDb250YWluZXIpO1xyXG4gICAgICAgICRnYWxsZXJ5SW1hZ2UuZ2V0KDApLnNyYyA9IGxhcmdlUGF0aDsgLy8gVE9ETzogTWFrZSB0aGlzIGxhenkhXHJcbiAgICAgICAgJGdhbGxlcnlJbWFnZXMucHVzaCgkZ2FsbGVyeUltYWdlKTtcclxuICAgIH1cclxuICAgIHJldHVybiAkZ2FsbGVyeUltYWdlcztcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IFRodW1ibmFpbFNsaWRlcjtcclxuXHJcbmZ1bmN0aW9uIFRodW1ibmFpbFNsaWRlcigkY29udGFpbmVyLCBzbGlkZXNob3cpIHtcclxuICAgIHRoaXMuXyRjb250YWluZXIgPSAkY29udGFpbmVyO1xyXG4gICAgdGhpcy5fc2xpZGVzaG93ID0gc2xpZGVzaG93O1xyXG5cclxuICAgIHRoaXMuX2luZGV4ID0gMDsgLy8gSW5kZXggb2Ygc2VsZWN0ZWQgdGh1bWJuYWlsXHJcbiAgICB0aGlzLl9zY3JvbGxJbmRleCA9IDA7IC8vIEluZGV4IG9mIHRoZSB0aHVtYm5haWwgdGhhdCBpcyBjdXJyZW50bHkgY2VudGVyZWRcclxuXHJcbiAgICAvLyBDYWNoZSBhbmQgY3JlYXRlIG5lY2Vzc2FyeSBET00gZWxlbWVudHNcclxuICAgIHRoaXMuXyR0aHVtYm5haWxDb250YWluZXIgPSAkY29udGFpbmVyLmZpbmQoXCIudGh1bWJuYWlsc1wiKTtcclxuICAgIHRoaXMuXyR0aHVtYm5haWxJbWFnZXMgPSB0aGlzLl8kdGh1bWJuYWlsQ29udGFpbmVyLmZpbmQoXCJpbWdcIik7XHJcbiAgICB0aGlzLl8kdmlzaWJsZVRodW1ibmFpbFdyYXAgPSAkY29udGFpbmVyLmZpbmQoXCIudmlzaWJsZS10aHVtYm5haWxzXCIpO1xyXG4gICAgdGhpcy5fJGFkdmFuY2VMZWZ0ID0gJGNvbnRhaW5lci5maW5kKFwiLnRodW1ibmFpbC1hZHZhbmNlLWxlZnRcIik7XHJcbiAgICB0aGlzLl8kYWR2YW5jZVJpZ2h0ID0gJGNvbnRhaW5lci5maW5kKFwiLnRodW1ibmFpbC1hZHZhbmNlLXJpZ2h0XCIpO1xyXG5cclxuICAgIC8vIExvb3AgdGhyb3VnaCB0aGUgdGh1bWJuYWlscywgZ2l2ZSB0aGVtIGFuIGluZGV4IGRhdGEgYXR0cmlidXRlIGFuZCBjYWNoZVxyXG4gICAgLy8gYSByZWZlcmVuY2UgdG8gdGhlbSBpbiBhbiBhcnJheVxyXG4gICAgdGhpcy5fJHRodW1ibmFpbHMgPSBbXTtcclxuICAgIHRoaXMuXyR0aHVtYm5haWxJbWFnZXMuZWFjaChmdW5jdGlvbiAoaW5kZXgsIGVsZW1lbnQpIHtcclxuICAgICAgICB2YXIgJHRodW1ibmFpbCA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgJHRodW1ibmFpbC5kYXRhKFwiaW5kZXhcIiwgaW5kZXgpO1xyXG4gICAgICAgIHRoaXMuXyR0aHVtYm5haWxzLnB1c2goJHRodW1ibmFpbCk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5fbnVtSW1hZ2VzID0gdGhpcy5fJHRodW1ibmFpbHMubGVuZ3RoO1xyXG5cclxuICAgIC8vIExlZnQvcmlnaHQgY29udHJvbHNcclxuICAgIHRoaXMuXyRhZHZhbmNlTGVmdC5vbihcImNsaWNrXCIsIHRoaXMuYWR2YW5jZUxlZnQuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLl8kYWR2YW5jZVJpZ2h0Lm9uKFwiY2xpY2tcIiwgdGhpcy5hZHZhbmNlUmlnaHQuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLy8gQ2xpY2tpbmcgYSB0aHVtYm5haWxcclxuICAgIHRoaXMuXyR0aHVtYm5haWxJbWFnZXMub24oXCJjbGlja1wiLCB0aGlzLl9vbkNsaWNrLmJpbmQodGhpcykpO1xyXG5cclxuICAgIHRoaXMuX2FjdGl2YXRlVGh1bWJuYWlsKDApO1xyXG5cclxuICAgIC8vIFJlc2l6ZVxyXG4gICAgJCh3aW5kb3cpLm9uKFwicmVzaXplXCIsIHRoaXMuX29uUmVzaXplLmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8vIEZvciBzb21lIHJlYXNvbiwgdGhlIHNpemluZyBvbiB0aGUgY29udHJvbHMgaXMgbWVzc2VkIHVwIGlmIGl0IHJ1bnNcclxuICAgIC8vIGltbWVkaWF0ZWx5IC0gZGVsYXkgc2l6aW5nIHVudGlsIHN0YWNrIGlzIGNsZWFyXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLl9vblJlc2l6ZSgpO1xyXG4gICAgfS5iaW5kKHRoaXMpLCAwKTtcclxufVxyXG5cclxuVGh1bWJuYWlsU2xpZGVyLnByb3RvdHlwZS5nZXRBY3RpdmVJbmRleCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLl9pbmRleDtcclxufTtcclxuXHJcblRodW1ibmFpbFNsaWRlci5wcm90b3R5cGUuZ2V0TnVtVGh1bWJuYWlscyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLl9udW1JbWFnZXM7XHJcbn07XHJcblxyXG5UaHVtYm5haWxTbGlkZXIucHJvdG90eXBlLmdldCRUaHVtYm5haWwgPSBmdW5jdGlvbiAoaW5kZXgpIHtcclxuICAgIHJldHVybiB0aGlzLl8kdGh1bWJuYWlsc1tpbmRleF07XHJcbn07XHJcblxyXG5UaHVtYm5haWxTbGlkZXIucHJvdG90eXBlLmFkdmFuY2VMZWZ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIG5ld0luZGV4ID0gdGhpcy5fc2Nyb2xsSW5kZXggLSB0aGlzLl9udW1WaXNpYmxlO1xyXG4gICAgbmV3SW5kZXggPSBNYXRoLm1heChuZXdJbmRleCwgMCk7XHJcbiAgICB0aGlzLl9zY3JvbGxUb1RodW1ibmFpbChuZXdJbmRleCk7XHJcbn07XHJcblxyXG5UaHVtYm5haWxTbGlkZXIucHJvdG90eXBlLmFkdmFuY2VSaWdodCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBuZXdJbmRleCA9IHRoaXMuX3Njcm9sbEluZGV4ICsgdGhpcy5fbnVtVmlzaWJsZTtcclxuICAgIG5ld0luZGV4ID0gTWF0aC5taW4obmV3SW5kZXgsIHRoaXMuX251bUltYWdlcyAtIDEpO1xyXG4gICAgdGhpcy5fc2Nyb2xsVG9UaHVtYm5haWwobmV3SW5kZXgpO1xyXG59O1xyXG5cclxuVGh1bWJuYWlsU2xpZGVyLnByb3RvdHlwZS5fcmVzZXRTaXppbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBSZXNldCBzaXppbmcgdmFyaWFibGVzLiBUaGlzIGluY2x1ZGVzIHJlc2V0dGluZyBhbnkgaW5saW5lIHN0eWxlIHRoYXQgaGFzXHJcbiAgICAvLyBiZWVuIGFwcGxpZWQsIHNvIHRoYXQgYW55IHNpemUgY2FsY3VsYXRpb25zIGNhbiBiZSBiYXNlZCBvbiB0aGUgQ1NTXHJcbiAgICAvLyBzdHlsaW5nLlxyXG4gICAgdGhpcy5fJHRodW1ibmFpbENvbnRhaW5lci5jc3Moe1xyXG4gICAgICAgIHRvcDogXCJcIiwgbGVmdDogXCJcIiwgd2lkdGg6IFwiXCIsIGhlaWdodDogXCJcIlxyXG4gICAgfSk7XHJcbiAgICB0aGlzLl8kdmlzaWJsZVRodW1ibmFpbFdyYXAud2lkdGgoXCJcIik7XHJcbiAgICB0aGlzLl8kdmlzaWJsZVRodW1ibmFpbFdyYXAuaGVpZ2h0KFwiXCIpO1xyXG4gICAgLy8gTWFrZSBhbGwgdGh1bWJuYWlscyBzcXVhcmUgYW5kIHJlc2V0IGFueSBoZWlnaHRcclxuICAgIHRoaXMuXyR0aHVtYm5haWxzLmZvckVhY2goZnVuY3Rpb24gKCRlbGVtZW50KSB7IFxyXG4gICAgICAgICRlbGVtZW50LmhlaWdodChcIlwiKTsgLy8gUmVzZXQgaGVpZ2h0IGJlZm9yZSBzZXR0aW5nIHdpZHRoXHJcbiAgICAgICAgJGVsZW1lbnQud2lkdGgoJGVsZW1lbnQuaGVpZ2h0KCkpO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG5UaHVtYm5haWxTbGlkZXIucHJvdG90eXBlLl9vblJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuX3Jlc2V0U2l6aW5nKCk7XHJcblxyXG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBzaXplIG9mIHRoZSBmaXJzdCB0aHVtYm5haWwuIFRoaXMgYXNzdW1lcyB0aGUgZmlyc3QgaW1hZ2VcclxuICAgIC8vIG9ubHkgaGFzIGEgcmlnaHQtc2lkZSBtYXJnaW4uXHJcbiAgICB2YXIgJGZpcnN0VGh1bWIgPSB0aGlzLl8kdGh1bWJuYWlsc1swXTtcclxuICAgIHZhciB0aHVtYlNpemUgPSAkZmlyc3RUaHVtYi5vdXRlckhlaWdodChmYWxzZSk7XHJcbiAgICB2YXIgdGh1bWJNYXJnaW4gPSAyICogKCRmaXJzdFRodW1iLm91dGVyV2lkdGgodHJ1ZSkgLSB0aHVtYlNpemUpO1xyXG5cclxuICAgIC8vIE1lYXN1cmUgY29udHJvbHMuIFRoZXkgbmVlZCB0byBiZSB2aXNpYmxlIGluIG9yZGVyIHRvIGJlIG1lYXN1cmVkLlxyXG4gICAgdGhpcy5fJGFkdmFuY2VSaWdodC5jc3MoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XHJcbiAgICB0aGlzLl8kYWR2YW5jZUxlZnQuY3NzKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xyXG4gICAgdmFyIHRodW1iQ29udHJvbFdpZHRoID0gdGhpcy5fJGFkdmFuY2VSaWdodC5vdXRlcldpZHRoKHRydWUpICtcclxuICAgICAgICB0aGlzLl8kYWR2YW5jZUxlZnQub3V0ZXJXaWR0aCh0cnVlKTtcclxuXHJcbiAgICAvLyBDYWxjdWxhdGUgaG93IG1hbnkgdGh1bWJuYWlscyBjYW4gZml0IHdpdGhpbiB0aGUgdGh1bWJuYWlsIGFyZWFcclxuICAgIHZhciB2aXNpYmxlV2lkdGggPSB0aGlzLl8kdmlzaWJsZVRodW1ibmFpbFdyYXAub3V0ZXJXaWR0aChmYWxzZSk7XHJcbiAgICB2YXIgbnVtVGh1bWJzVmlzaWJsZSA9ICh2aXNpYmxlV2lkdGggLSB0aHVtYk1hcmdpbikgLyBcclxuICAgICAgICAodGh1bWJTaXplICsgdGh1bWJNYXJnaW4pO1xyXG5cclxuICAgIC8vIENoZWNrIHdoZXRoZXIgYWxsIHRoZSB0aHVtYm5haWxzIGNhbiBmaXQgb24gdGhlIHNjcmVlbiBhdCBvbmNlXHJcbiAgICBpZiAobnVtVGh1bWJzVmlzaWJsZSA8IHRoaXMuX251bUltYWdlcykge1xyXG4gICAgICAgIHRoaXMuX2FsbFRodW1ibmFpbFNsaWRlclZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICAvLyBUYWtlIGEgYmVzdCBndWVzcyBhdCBob3cgdG8gc2l6ZSB0aGUgdGh1bWJuYWlscy4gU2l6ZSBmb3JtdWxhOlxyXG4gICAgICAgIC8vICB3aWR0aCA9IG51bSAqIHRodW1iU2l6ZSArIChudW0gLSAxKSAqIHRodW1iTWFyZ2luICsgY29udHJvbFNpemVcclxuICAgICAgICAvLyBTb2x2ZSBmb3IgbnVtYmVyIG9mIHRodW1ibmFpbHMgYW5kIHJvdW5kIHRvIHRoZSBuZWFyZXN0IGludGVnZXIgc28gXHJcbiAgICAgICAgLy8gdGhhdCB3ZSBkb24ndCBoYXZlIGFueSBwYXJ0aWFsIHRodW1ibmFpbHMgc2hvd2luZy5cclxuICAgICAgICBudW1UaHVtYnNWaXNpYmxlID0gTWF0aC5yb3VuZChcclxuICAgICAgICAgICAgKHZpc2libGVXaWR0aCAtIHRodW1iQ29udHJvbFdpZHRoICsgdGh1bWJNYXJnaW4pIC8gXHJcbiAgICAgICAgICAgICh0aHVtYlNpemUgKyB0aHVtYk1hcmdpbilcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBVc2UgdGhpcyBudW1iZXIgb2YgdGh1bWJuYWlscyB0byBjYWxjdWxhdGUgdGhlIHRodW1ibmFpbCBzaXplXHJcbiAgICAgICAgdmFyIG5ld1NpemUgPSAodmlzaWJsZVdpZHRoIC0gdGh1bWJDb250cm9sV2lkdGggKyB0aHVtYk1hcmdpbikgLyBcclxuICAgICAgICAgICAgbnVtVGh1bWJzVmlzaWJsZSAtIHRodW1iTWFyZ2luO1xyXG4gICAgICAgIHRoaXMuXyR0aHVtYm5haWxzLmZvckVhY2goZnVuY3Rpb24gKCRlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIC8vICQud2lkdGggYW5kICQuaGVpZ2h0IHNldCB0aGUgY29udGVudCBzaXplIHJlZ2FyZGxlc3Mgb2YgdGhlIFxyXG4gICAgICAgICAgICAvLyBib3gtc2l6aW5nLiBUaGUgaW1hZ2VzIGFyZSBib3JkZXItYm94LCBzbyB3ZSB3YW50IHRoZSBDU1Mgd2lkdGhcclxuICAgICAgICAgICAgLy8gYW5kIGhlaWdodC4gVGhpcyBhbGxvd3MgdGhlIGFjdGl2ZSBpbWFnZSB0byBoYXZlIGEgYm9yZGVyIGFuZCB0aGVcclxuICAgICAgICAgICAgLy8gb3RoZXIgaW1hZ2VzIHRvIGhhdmUgcGFkZGluZy4gXHJcbiAgICAgICAgICAgICRlbGVtZW50LmNzcyhcIndpZHRoXCIsIG5ld1NpemUgKyBcInB4XCIpO1xyXG4gICAgICAgICAgICAkZWxlbWVudC5jc3MoXCJoZWlnaHRcIiwgbmV3U2l6ZSArIFwicHhcIik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFNldCB0aGUgdGh1bWJuYWlsIHdyYXAgc2l6ZS4gSXQgc2hvdWxkIGJlIGp1c3QgdGFsbCBlbm91Z2ggdG8gZml0IGFcclxuICAgICAgICAvLyB0aHVtYm5haWwgYW5kIGxvbmcgZW5vdWdoIHRvIGhvbGQgYWxsIHRoZSB0aHVtYm5haWxzIGluIG9uZSBsaW5lOlxyXG4gICAgICAgIHZhciB0b3RhbFNpemUgPSBuZXdTaXplICogdGhpcy5fbnVtSW1hZ2VzICsgXHJcbiAgICAgICAgICAgIHRodW1iTWFyZ2luICogKHRoaXMuX251bUltYWdlcyAtIDEpO1xyXG4gICAgICAgIHRoaXMuXyR0aHVtYm5haWxDb250YWluZXIuY3NzKHtcclxuICAgICAgICAgICAgd2lkdGg6IHRvdGFsU2l6ZSArIFwicHhcIixcclxuICAgICAgICAgICAgaGVpZ2h0OiAkZmlyc3RUaHVtYi5vdXRlckhlaWdodCh0cnVlKSArIFwicHhcIlxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBTZXQgdGhlIHZpc2libGUgdGh1bWJuYWlsIHdyYXAgc2l6ZS4gVGhpcyBpcyB1c2VkIHRvIG1ha3MgdGhlIG11Y2ggXHJcbiAgICAgICAgLy8gbGFyZ2VyIHRodW1ibmFpbCBjb250YWluZXIuIEl0IHNob3VsZCBiZSBhcyB3aWRlIGFzIGl0IGNhbiBiZSwgbWludXNcclxuICAgICAgICAvLyB0aGUgc3BhY2UgbmVlZGVkIGZvciB0aGUgbGVmdC9yaWdodCBjb250b2xzLlxyXG4gICAgICAgIHRoaXMuXyR2aXNpYmxlVGh1bWJuYWlsV3JhcC5jc3Moe1xyXG4gICAgICAgICAgICB3aWR0aDogdmlzaWJsZVdpZHRoIC0gdGh1bWJDb250cm9sV2lkdGggKyBcInB4XCIsXHJcbiAgICAgICAgICAgIGhlaWdodDogJGZpcnN0VGh1bWIub3V0ZXJIZWlnaHQodHJ1ZSkgKyBcInB4XCJcclxuICAgICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQWxsIHRodW1ibmFpbHMgYXJlIHZpc2libGUsIHdlIGNhbiBoaWRlIHRoZSBjb250cm9scyBhbmQgZXhwYW5kIHRoZVxyXG4gICAgICAgIC8vIHRodW1ibmFpbCBjb250YWluZXIgdG8gMTAwJVxyXG4gICAgICAgIHRoaXMuX2FsbFRodW1ibmFpbFNsaWRlclZpc2libGUgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuXyR0aHVtYm5haWxDb250YWluZXIuY3NzKFwid2lkdGhcIiwgXCIxMDAlXCIpO1xyXG4gICAgICAgIHRoaXMuXyRhZHZhbmNlUmlnaHQuY3NzKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XHJcbiAgICAgICAgdGhpcy5fJGFkdmFuY2VMZWZ0LmNzcyhcImRpc3BsYXlcIiwgXCJub25lXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX251bVZpc2libGUgPSBudW1UaHVtYnNWaXNpYmxlO1xyXG4gICAgdGhpcy5fdXBkYXRlVGh1bWJuYWlsQ29udHJvbHMoKTtcclxufTtcclxuXHJcblRodW1ibmFpbFNsaWRlci5wcm90b3R5cGUuX2FjdGl2YXRlVGh1bWJuYWlsID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAvLyBBY3RpdmF0ZS9kZWFjdGl2YXRlIHRodW1ibmFpbHNcclxuICAgIHRoaXMuXyR0aHVtYm5haWxzW3RoaXMuX2luZGV4XS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcclxuICAgIHRoaXMuXyR0aHVtYm5haWxzW2luZGV4XS5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcclxufTtcclxuXHJcblRodW1ibmFpbFNsaWRlci5wcm90b3R5cGUuX3Njcm9sbFRvVGh1bWJuYWlsID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAvLyBDb25zdHJhaW4gaW5kZXggc28gdGhhdCB3ZSBjYW4ndCBzY3JvbGwgb3V0IG9mIGJvdW5kcyBcclxuICAgIHZhciBtaWRTY3JvbGxJbmRleCA9IE1hdGguZmxvb3IoKHRoaXMuX251bVZpc2libGUgLSAxKSAvIDIpO1xyXG4gICAgdmFyIG1pblNjcm9sbEluZGV4ID0gbWlkU2Nyb2xsSW5kZXg7XHJcbiAgICB2YXIgbWF4U2Nyb2xsSW5kZXggPSB0aGlzLl9udW1JbWFnZXMgLSAxIC0gbWlkU2Nyb2xsSW5kZXg7XHJcbiAgICBpbmRleCA9IE1hdGgubWF4KGluZGV4LCBtaW5TY3JvbGxJbmRleCk7XHJcbiAgICBpbmRleCA9IE1hdGgubWluKGluZGV4LCBtYXhTY3JvbGxJbmRleCk7XHJcblxyXG4gICAgdGhpcy5fc2Nyb2xsSW5kZXggPSBpbmRleDtcclxuXHJcbiAgICAvLyBGaW5kIHRoZSBcImxlZnRcIiBwb3NpdGlvbiBvZiB0aGUgdGh1bWJuYWlsIGNvbnRhaW5lciB0aGF0IHdvdWxkIHB1dCB0aGUgXHJcbiAgICAvLyB0aHVtYm5haWwgYXQgaW5kZXggYXQgdGhlIGNlbnRlclxyXG4gICAgdmFyICR0aHVtYiA9IHRoaXMuXyR0aHVtYm5haWxzWzBdO1xyXG4gICAgdmFyIHNpemUgPSBwYXJzZUZsb2F0KCR0aHVtYi5jc3MoXCJ3aWR0aFwiKSk7XHJcbiAgICB2YXIgbWFyZ2luID0gMiAqIHBhcnNlRmxvYXQoJHRodW1iLmNzcyhcIm1hcmdpbi1yaWdodFwiKSk7IFxyXG4gICAgdmFyIGNlbnRlclggPSBzaXplICogbWlkU2Nyb2xsSW5kZXggKyBtYXJnaW4gKiAobWlkU2Nyb2xsSW5kZXggLSAxKTtcclxuICAgIHZhciB0aHVtYlggPSBzaXplICogaW5kZXggKyBtYXJnaW4gKiAoaW5kZXggLSAxKTtcclxuICAgIHZhciBsZWZ0ID0gY2VudGVyWCAtIHRodW1iWDtcclxuXHJcbiAgICAvLyBBbmltYXRlIHRoZSB0aHVtYm5haWwgY29udGFpbmVyXHJcbiAgICB0aGlzLl8kdGh1bWJuYWlsQ29udGFpbmVyLnZlbG9jaXR5KFwic3RvcFwiKTtcclxuICAgIHRoaXMuXyR0aHVtYm5haWxDb250YWluZXIudmVsb2NpdHkoe1xyXG4gICAgICAgIFwibGVmdFwiOiBsZWZ0ICsgXCJweFwiXHJcbiAgICB9LCA2MDAsIFwiZWFzZUluT3V0UXVhZFwiKTtcclxuXHJcbiAgICB0aGlzLl91cGRhdGVUaHVtYm5haWxDb250cm9scygpO1xyXG59O1xyXG5cclxuVGh1bWJuYWlsU2xpZGVyLnByb3RvdHlwZS5fb25DbGljayA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICB2YXIgJHRhcmdldCA9ICQoZS50YXJnZXQpO1xyXG4gICAgdmFyIGluZGV4ID0gJHRhcmdldC5kYXRhKFwiaW5kZXhcIik7XHJcbiAgICBcclxuICAgIC8vIENsaWNrZWQgb24gdGhlIGFjdGl2ZSBpbWFnZSAtIG5vIG5lZWQgdG8gZG8gYW55dGhpbmdcclxuICAgIGlmICh0aGlzLl9pbmRleCAhPT0gaW5kZXgpIHtcclxuICAgICAgICB0aGlzLl9hY3RpdmF0ZVRodW1ibmFpbChpbmRleCk7XHJcbiAgICAgICAgdGhpcy5fc2Nyb2xsVG9UaHVtYm5haWwoaW5kZXgpO1xyXG4gICAgICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgdGhpcy5fc2xpZGVzaG93LnNob3dJbWFnZShpbmRleCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5UaHVtYm5haWxTbGlkZXIucHJvdG90eXBlLl91cGRhdGVUaHVtYm5haWxDb250cm9scyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIFJlLWVuYWJsZVxyXG4gICAgdGhpcy5fJGFkdmFuY2VMZWZ0LnJlbW92ZUNsYXNzKFwiZGlzYWJsZWRcIik7XHJcbiAgICB0aGlzLl8kYWR2YW5jZVJpZ2h0LnJlbW92ZUNsYXNzKFwiZGlzYWJsZWRcIik7XHJcbiAgICBcclxuICAgIC8vIERpc2FibGUgaWYgd2UndmUgcmVhY2hlZCB0aGUgdGhlIG1heCBvciBtaW4gbGltaXRcclxuICAgIHZhciBtaWRTY3JvbGxJbmRleCA9IE1hdGguZmxvb3IoKHRoaXMuX251bVZpc2libGUgLSAxKSAvIDIpO1xyXG4gICAgdmFyIG1pblNjcm9sbEluZGV4ID0gbWlkU2Nyb2xsSW5kZXg7XHJcbiAgICB2YXIgbWF4U2Nyb2xsSW5kZXggPSB0aGlzLl9udW1JbWFnZXMgLSAxIC0gbWlkU2Nyb2xsSW5kZXg7XHJcbiAgICBpZiAodGhpcy5fc2Nyb2xsSW5kZXggPj0gbWF4U2Nyb2xsSW5kZXgpIHtcclxuICAgICAgICB0aGlzLl8kYWR2YW5jZVJpZ2h0LmFkZENsYXNzKFwiZGlzYWJsZWRcIik7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMuX3Njcm9sbEluZGV4IDw9IG1pblNjcm9sbEluZGV4KSB7XHJcbiAgICAgICAgdGhpcy5fJGFkdmFuY2VMZWZ0LmFkZENsYXNzKFwiZGlzYWJsZWRcIik7XHJcbiAgICB9XHJcbn07Il19
