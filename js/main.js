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
    var middleIndex = Math.floor((this._numVisible - 1) / 2);
    this._scrollBounds = {
        min: middleIndex,
        max: this._numImages - 1 - middleIndex
    };
    if (this._numVisible % 2 === 0) this._scrollBounds.max -= 1;

    this._updateThumbnailControls();
};

ThumbnailSlider.prototype._activateThumbnail = function (index) {
    // Activate/deactivate thumbnails
    this._$thumbnails[this._index].removeClass("active");
    this._$thumbnails[index].addClass("active");
};

ThumbnailSlider.prototype._scrollToThumbnail = function (index) {
    // Constrain index so that we can't scroll out of bounds 
    index = Math.max(index, this._scrollBounds.min);
    index = Math.min(index, this._scrollBounds.max);
    this._scrollIndex = index;
    
    // Find the "left" position of the thumbnail container that would put the 
    // thumbnail at index at the center
    var $thumb = this._$thumbnails[0];
    var size = parseFloat($thumb.css("width"));
    var margin = 2 * parseFloat($thumb.css("margin-right")); 
    var centerX = size * this._scrollBounds.min + 
        margin * (this._scrollBounds.min - 1);
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
    if (this._scrollIndex >= this._scrollBounds.max) {
        this._$advanceRight.addClass("disabled");
    } else if (this._scrollIndex <= this._scrollBounds.min) {
        this._$advanceLeft.addClass("disabled");
    }
};
},{}]},{},[2])


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvb2JqZWN0LWZpdC1pbWFnZXMvZGlzdC9vZmkuY29tbW9uLWpzLmpzIiwic3JjL2pzL21haW4uanMiLCJzcmMvanMvc2xpZGVzaG93LW1vZGFsLmpzIiwic3JjL2pzL3NsaWRlc2hvdy5qcyIsInNyYy9qcy90aHVtYm5haWwtc2xpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM05BO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIOCyoCA9ICdkYXRhOmltYWdlL2dpZjtiYXNlNjQsUjBsR09EbGhBUUFCQUlBQUFQLy8vd0FBQUNINUJBRUFBQUFBTEFBQUFBQUJBQUVBQUFJQ1JBRUFPdz09JzsgLy8gdHJhbnNwYXJlbnQgaW1hZ2UsIHVzZWQgYXMgYWNjZXNzb3IgYW5kIHJlcGxhY2luZyBpbWFnZVxudmFyIHByb3BSZWdleCA9IC8ob2JqZWN0LWZpdHxvYmplY3QtcG9zaXRpb24pXFxzKjpcXHMqKFstXFx3XFxzJV0rKS9nO1xudmFyIHRlc3RJbWcgPSBuZXcgSW1hZ2UoKTtcbnZhciBzdXBwb3J0c09iamVjdEZpdCA9ICdvYmplY3QtZml0JyBpbiB0ZXN0SW1nLnN0eWxlO1xudmFyIHN1cHBvcnRzT2JqZWN0UG9zaXRpb24gPSAnb2JqZWN0LXBvc2l0aW9uJyBpbiB0ZXN0SW1nLnN0eWxlO1xudmFyIHN1cHBvcnRzQ3VycmVudFNyYyA9IHR5cGVvZiB0ZXN0SW1nLmN1cnJlbnRTcmMgPT09ICdzdHJpbmcnO1xudmFyIG5hdGl2ZUdldEF0dHJpYnV0ZSA9IHRlc3RJbWcuZ2V0QXR0cmlidXRlO1xudmFyIG5hdGl2ZVNldEF0dHJpYnV0ZSA9IHRlc3RJbWcuc2V0QXR0cmlidXRlO1xudmFyIGF1dG9Nb2RlRW5hYmxlZCA9IGZhbHNlO1xuXG5mdW5jdGlvbiBnZXRTdHlsZShlbCkge1xuXHR2YXIgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsKS5mb250RmFtaWx5O1xuXHR2YXIgcGFyc2VkO1xuXHR2YXIgcHJvcHMgPSB7fTtcblx0d2hpbGUgKChwYXJzZWQgPSBwcm9wUmVnZXguZXhlYyhzdHlsZSkpICE9PSBudWxsKSB7XG5cdFx0cHJvcHNbcGFyc2VkWzFdXSA9IHBhcnNlZFsyXTtcblx0fVxuXHRyZXR1cm4gcHJvcHM7XG59XG5cbmZ1bmN0aW9uIGZpeE9uZShlbCwgcmVxdWVzdGVkU3JjKSB7XG5cdGlmIChlbFvgsqBdLnBhcnNpbmdTcmNzZXQpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0dmFyIHN0eWxlID0gZ2V0U3R5bGUoZWwpO1xuXHRzdHlsZVsnb2JqZWN0LWZpdCddID0gc3R5bGVbJ29iamVjdC1maXQnXSB8fCAnZmlsbCc7IC8vIGRlZmF1bHQgdmFsdWVcblxuXHQvLyBJZiB0aGUgZml4IHdhcyBhbHJlYWR5IGFwcGxpZWQsIGRvbid0IHRyeSB0byBza2lwIGZpeGluZyxcblx0Ly8gLSBiZWNhdXNlIG9uY2UgeW91IGdvIG9maSB5b3UgbmV2ZXIgZ28gYmFjay5cblx0Ly8gLSBXYWl0LCB0aGF0IGRvZXNuJ3Qgcmh5bWUuXG5cdC8vIC0gVGhpcyBhaW4ndCByYXAsIGJyby5cblx0aWYgKCFlbFvgsqBdLnMpIHtcblx0XHQvLyBmaWxsIGlzIHRoZSBkZWZhdWx0IGJlaGF2aW9yIHNvIG5vIGFjdGlvbiBpcyBuZWNlc3Nhcnlcblx0XHRpZiAoc3R5bGVbJ29iamVjdC1maXQnXSA9PT0gJ2ZpbGwnKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gV2hlcmUgb2JqZWN0LWZpdCBpcyBzdXBwb3J0ZWQgYW5kIG9iamVjdC1wb3NpdGlvbiBpc24ndCAoU2FmYXJpIDwgMTApXG5cdFx0aWYgKCFlbFvgsqBdLnNraXBUZXN0ICYmIC8vIHVubGVzcyB1c2VyIHdhbnRzIHRvIGFwcGx5IHJlZ2FyZGxlc3Mgb2YgYnJvd3NlciBzdXBwb3J0XG5cdFx0c3VwcG9ydHNPYmplY3RGaXQgJiYgLy8gaWYgYnJvd3NlciBhbHJlYWR5IHN1cHBvcnRzIG9iamVjdC1maXRcblx0XHQhc3R5bGVbJ29iamVjdC1wb3NpdGlvbiddIC8vIHVubGVzcyBvYmplY3QtcG9zaXRpb24gaXMgdXNlZFxuXHRcdCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdH1cblxuXHR2YXIgc3JjID0gZWwuY3VycmVudFNyYyB8fCBlbC5zcmM7XG5cblx0aWYgKHJlcXVlc3RlZFNyYykge1xuXHRcdC8vIGV4cGxpY2l0bHkgcmVxdWVzdGVkIHNyYyB0YWtlcyBwcmVjZWRlbmNlXG5cdFx0Ly8gVE9ETzogdGhpcyBzdGlsbCBzaG91bGQgb3ZlcndyaXRlIHNyY3NldFxuXHRcdHNyYyA9IHJlcXVlc3RlZFNyYztcblx0fSBlbHNlIGlmIChlbC5zcmNzZXQgJiYgIXN1cHBvcnRzQ3VycmVudFNyYyAmJiB3aW5kb3cucGljdHVyZWZpbGwpIHtcblx0XHR2YXIgcGYgPSB3aW5kb3cucGljdHVyZWZpbGwuXy5ucztcblx0XHQvLyBwcmV2ZW50IGluZmluaXRlIGxvb3Bcblx0XHQvLyBmaWxsSW1nIHNldHMgdGhlIHNyYyB3aGljaCBpbiB0dXJuIGNhbGxzIGZpeE9uZVxuXHRcdGVsW+CyoF0ucGFyc2luZ1NyY3NldCA9IHRydWU7XG5cblx0XHQvLyBwYXJzZSBzcmNzZXQgd2l0aCBwaWN0dXJlZmlsbCB3aGVyZSBjdXJyZW50U3JjIGlzbid0IGF2YWlsYWJsZVxuXHRcdGlmICghZWxbcGZdIHx8ICFlbFtwZl0uZXZhbGVkKSB7XG5cdFx0XHQvLyBmb3JjZSBzeW5jaHJvbm91cyBzcmNzZXQgcGFyc2luZ1xuXHRcdFx0d2luZG93LnBpY3R1cmVmaWxsLl8uZmlsbEltZyhlbCwgeyByZXNlbGVjdDogdHJ1ZSB9KTtcblx0XHR9XG5cblx0XHRpZiAoIWVsW3BmXS5jdXJTcmMpIHtcblx0XHRcdC8vIGZvcmNlIHBpY3R1cmVmaWxsIHRvIHBhcnNlIHNyY3NldFxuXHRcdFx0ZWxbcGZdLnN1cHBvcnRlZCA9IGZhbHNlO1xuXHRcdFx0d2luZG93LnBpY3R1cmVmaWxsLl8uZmlsbEltZyhlbCwgeyByZXNlbGVjdDogdHJ1ZSB9KTtcblx0XHR9XG5cdFx0ZGVsZXRlIGVsW+CyoF0ucGFyc2luZ1NyY3NldDtcblxuXHRcdC8vIHJldHJpZXZlIHBhcnNlZCBjdXJyZW50U3JjLCBpZiBhbnlcblx0XHRzcmMgPSBlbFtwZl0uY3VyU3JjIHx8IHNyYztcblx0fVxuXG5cdC8vIHN0b3JlIGluZm8gb24gb2JqZWN0IGZvciBsYXRlciB1c2Vcblx0aWYgKGVsW+CyoF0ucykge1xuXHRcdGVsW+CyoF0ucyA9IHNyYztcblx0XHRpZiAocmVxdWVzdGVkU3JjKSB7XG5cdFx0XHQvLyB0aGUgYXR0cmlidXRlIHJlZmxlY3RzIHRoZSB1c2VyIGlucHV0XG5cdFx0XHQvLyB0aGUgcHJvcGVydHkgaXMgdGhlIHJlc29sdmVkIFVSTFxuXHRcdFx0ZWxb4LKgXS5zcmNBdHRyID0gcmVxdWVzdGVkU3JjO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRlbFvgsqBdID0ge1xuXHRcdFx0czogc3JjLFxuXHRcdFx0c3JjQXR0cjogcmVxdWVzdGVkU3JjIHx8IG5hdGl2ZUdldEF0dHJpYnV0ZS5jYWxsKGVsLCAnc3JjJyksXG5cdFx0XHRzcmNzZXRBdHRyOiBlbC5zcmNzZXRcblx0XHR9O1xuXHRcdGVsLnNyYyA9IOCyoDtcblxuXHRcdC8vIHJlbW92ZSBzcmNzZXQgYmVjYXVzZSBpdCBvdmVycmlkZXMgc3JjXG5cdFx0aWYgKGVsLnNyY3NldCkge1xuXHRcdFx0ZWwuc3Jjc2V0ID0gJyc7XG5cblx0XHRcdC8vIHJlc3RvcmUgbm9uLWJyb3dzZXItcmVhZGFibGUgc3Jjc2V0IHByb3BlcnR5XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZWwsICdzcmNzZXQnLCB7XG5cdFx0XHRcdHZhbHVlOiBlbFvgsqBdLnNyY3NldEF0dHJcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGtlZXBTcmNVc2FibGUoZWwpO1xuXHR9XG5cblx0ZWwuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gJ3VybChcIicgKyBzcmMgKyAnXCIpJztcblx0ZWwuc3R5bGUuYmFja2dyb3VuZFBvc2l0aW9uID0gc3R5bGVbJ29iamVjdC1wb3NpdGlvbiddIHx8ICdjZW50ZXInO1xuXHRlbC5zdHlsZS5iYWNrZ3JvdW5kUmVwZWF0ID0gJ25vLXJlcGVhdCc7XG5cblx0aWYgKC9zY2FsZS1kb3duLy50ZXN0KHN0eWxlWydvYmplY3QtZml0J10pKSB7XG5cdFx0Ly8gYG9iamVjdC1maXQ6IHNjYWxlLWRvd25gIGlzIGVpdGhlciBgY29udGFpbmAgb3IgYGF1dG9gXG5cdFx0aWYgKCFlbFvgsqBdLmkpIHtcblx0XHRcdGVsW+CyoF0uaSA9IG5ldyBJbWFnZSgpO1xuXHRcdFx0ZWxb4LKgXS5pLnNyYyA9IHNyYztcblx0XHR9XG5cblx0XHQvLyBuYXR1cmFsV2lkdGggaXMgb25seSBhdmFpbGFibGUgd2hlbiB0aGUgaW1hZ2UgaGVhZGVycyBhcmUgbG9hZGVkLFxuXHRcdC8vIHRoaXMgbG9vcCB3aWxsIHBvbGwgaXQgZXZlcnkgMTAwbXMuXG5cdFx0Ly8gVGhlcmUncyBjdXJyZW50bHkgbm8gY2hlY2sgdG8gcHJldmVudCB0aGlzIGxvb3AgZnJvbSBzdGFydGluZyB0d2ljZVxuXHRcdC8vIGFzIGEgY29uc2VxdWVuY2Ugb2YgY2FsbGluZyBvZmkoKSB0d2ljZSBvbiB0aGUgc2FtZSBpbWFnZSwgYnV0IGl0J3MgbGlnaHRcblx0XHQvLyBhbmQgY2F1c2VzIG5vIGlzc3Vlcywgc28gaXQncyBub3Qgd29ydGggZW5zdXJpbmcgdGhhdCBpdCBkb2Vzbid0LlxuXHRcdChmdW5jdGlvbiBsb29wKCkge1xuXHRcdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9NDk1OTA4XG5cdFx0XHRpZiAoZWxb4LKgXS5pLm5hdHVyYWxXaWR0aCkge1xuXHRcdFx0XHRpZiAoZWxb4LKgXS5pLm5hdHVyYWxXaWR0aCA+IGVsLndpZHRoIHx8IGVsW+CyoF0uaS5uYXR1cmFsSGVpZ2h0ID4gZWwuaGVpZ2h0KSB7XG5cdFx0XHRcdFx0ZWwuc3R5bGUuYmFja2dyb3VuZFNpemUgPSAnY29udGFpbic7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZWwuc3R5bGUuYmFja2dyb3VuZFNpemUgPSAnYXV0byc7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0c2V0VGltZW91dChsb29wLCAxMDApO1xuXHRcdH0pKCk7XG5cdH0gZWxzZSB7XG5cdFx0ZWwuc3R5bGUuYmFja2dyb3VuZFNpemUgPSBzdHlsZVsnb2JqZWN0LWZpdCddLnJlcGxhY2UoJ25vbmUnLCAnYXV0bycpLnJlcGxhY2UoJ2ZpbGwnLCAnMTAwJSAxMDAlJyk7XG5cdH1cbn1cblxuZnVuY3Rpb24ga2VlcFNyY1VzYWJsZShlbCkge1xuXHR2YXIgZGVzY3JpcHRvcnMgPSB7XG5cdFx0Z2V0OiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gZWxb4LKgXS5zO1xuXHRcdH0sXG5cdFx0c2V0OiBmdW5jdGlvbiAoc3JjKSB7XG5cdFx0XHRkZWxldGUgZWxb4LKgXS5pOyAvLyBzY2FsZS1kb3duJ3MgaW1nIHNpemVzIG5lZWQgdG8gYmUgdXBkYXRlZCB0b29cblx0XHRcdGZpeE9uZShlbCwgc3JjKTtcblx0XHRcdHJldHVybiBzcmM7XG5cdFx0fVxuXHR9O1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZWwsICdzcmMnLCBkZXNjcmlwdG9ycyk7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbCwgJ2N1cnJlbnRTcmMnLCB7IGdldDogZGVzY3JpcHRvcnMuZ2V0IH0pOyAvLyBpdCBzaG91bGQgYmUgcmVhZC1vbmx5XG59XG5cbmZ1bmN0aW9uIGhpamFja0F0dHJpYnV0ZXMoKSB7XG5cdGlmICghc3VwcG9ydHNPYmplY3RQb3NpdGlvbikge1xuXHRcdEhUTUxJbWFnZUVsZW1lbnQucHJvdG90eXBlLmdldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG5cdFx0XHRpZiAodGhpc1vgsqBdICYmIChuYW1lID09PSAnc3JjJyB8fCBuYW1lID09PSAnc3Jjc2V0JykpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXNb4LKgXVtuYW1lICsgJ0F0dHInXTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBuYXRpdmVHZXRBdHRyaWJ1dGUuY2FsbCh0aGlzLCBuYW1lKTtcblx0XHR9O1xuXG5cdFx0SFRNTEltYWdlRWxlbWVudC5wcm90b3R5cGUuc2V0QXR0cmlidXRlID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG5cdFx0XHRpZiAodGhpc1vgsqBdICYmIChuYW1lID09PSAnc3JjJyB8fCBuYW1lID09PSAnc3Jjc2V0JykpIHtcblx0XHRcdFx0dGhpc1tuYW1lID09PSAnc3JjJyA/ICdzcmMnIDogbmFtZSArICdBdHRyJ10gPSBTdHJpbmcodmFsdWUpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bmF0aXZlU2V0QXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSwgdmFsdWUpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cbn1cblxuZnVuY3Rpb24gZml4KGltZ3MsIG9wdHMpIHtcblx0dmFyIHN0YXJ0QXV0b01vZGUgPSAhYXV0b01vZGVFbmFibGVkICYmICFpbWdzO1xuXHRvcHRzID0gb3B0cyB8fCB7fTtcblx0aW1ncyA9IGltZ3MgfHwgJ2ltZyc7XG5cdGlmIChzdXBwb3J0c09iamVjdFBvc2l0aW9uICYmICFvcHRzLnNraXBUZXN0KSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0Ly8gdXNlIGltZ3MgYXMgYSBzZWxlY3RvciBvciBqdXN0IHNlbGVjdCBhbGwgaW1hZ2VzXG5cdGlmICh0eXBlb2YgaW1ncyA9PT0gJ3N0cmluZycpIHtcblx0XHRpbWdzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaW1nJyk7XG5cdH0gZWxzZSBpZiAoIWltZ3MubGVuZ3RoKSB7XG5cdFx0aW1ncyA9IFtpbWdzXTtcblx0fVxuXG5cdC8vIGFwcGx5IGZpeCB0byBhbGxcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBpbWdzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aW1nc1tpXVvgsqBdID0gaW1nc1tpXVvgsqBdIHx8IG9wdHM7XG5cdFx0Zml4T25lKGltZ3NbaV0pO1xuXHR9XG5cblx0aWYgKHN0YXJ0QXV0b01vZGUpIHtcblx0XHRkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0aWYgKGUudGFyZ2V0LnRhZ05hbWUgPT09ICdJTUcnKSB7XG5cdFx0XHRcdGZpeChlLnRhcmdldCwge1xuXHRcdFx0XHRcdHNraXBUZXN0OiBvcHRzLnNraXBUZXN0XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0sIHRydWUpO1xuXHRcdGF1dG9Nb2RlRW5hYmxlZCA9IHRydWU7XG5cdFx0aW1ncyA9ICdpbWcnOyAvLyByZXNldCB0byBhIGdlbmVyaWMgc2VsZWN0b3IgZm9yIHdhdGNoTVFcblx0fVxuXG5cdC8vIGlmIHJlcXVlc3RlZCwgd2F0Y2ggbWVkaWEgcXVlcmllcyBmb3Igb2JqZWN0LWZpdCBjaGFuZ2Vcblx0aWYgKG9wdHMud2F0Y2hNUSkge1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBmaXguYmluZChudWxsLCBpbWdzLCB7XG5cdFx0XHRza2lwVGVzdDogb3B0cy5za2lwVGVzdFxuXHRcdH0pKTtcblx0fVxufVxuXG5maXguc3VwcG9ydHNPYmplY3RGaXQgPSBzdXBwb3J0c09iamVjdEZpdDtcbmZpeC5zdXBwb3J0c09iamVjdFBvc2l0aW9uID0gc3VwcG9ydHNPYmplY3RQb3NpdGlvbjtcblxuaGlqYWNrQXR0cmlidXRlcygpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZpeDsiLCJ2YXIgc2xpZGVzaG93cyA9IHJlcXVpcmUoXCIuL3NsaWRlc2hvdy5qc1wiKTtcclxuc2xpZGVzaG93cy5pbml0KCk7XHJcblxyXG5yZXF1aXJlKFwib2JqZWN0LWZpdC1pbWFnZXNcIikoKTsiLCJtb2R1bGUuZXhwb3J0cyA9IFNsaWRlc2hvd01vZGFsO1xyXG5cclxudmFyIEtFWV9DT0RFUyA9IHtcclxuICAgIExFRlRfQVJST1c6IDM3LFxyXG4gICAgUklHSFRfQVJST1c6IDM5LFxyXG4gICAgRVNDQVBFOiAyN1xyXG59O1xyXG5cclxuZnVuY3Rpb24gU2xpZGVzaG93TW9kYWwoJGNvbnRhaW5lciwgc2xpZGVzaG93KSB7XHJcbiAgICB0aGlzLl9zbGlkZXNob3cgPSBzbGlkZXNob3c7XHJcblxyXG4gICAgdGhpcy5fJG1vZGFsID0gJGNvbnRhaW5lci5maW5kKFwiLnNsaWRlc2hvdy1tb2RhbFwiKTtcclxuICAgIHRoaXMuXyRvdmVybGF5ID0gdGhpcy5fJG1vZGFsLmZpbmQoXCIubW9kYWwtb3ZlcmxheVwiKTtcclxuICAgIHRoaXMuXyRjb250ZW50ID0gdGhpcy5fJG1vZGFsLmZpbmQoXCIubW9kYWwtY29udGVudHNcIik7XHJcbiAgICB0aGlzLl8kY2FwdGlvbiA9IHRoaXMuXyRtb2RhbC5maW5kKFwiLm1vZGFsLWNhcHRpb25cIik7XHJcbiAgICB0aGlzLl8kaW1hZ2VDb250YWluZXIgPSB0aGlzLl8kbW9kYWwuZmluZChcIi5tb2RhbC1pbWFnZVwiKTtcclxuICAgIHRoaXMuXyRpbWFnZUxlZnQgPSB0aGlzLl8kbW9kYWwuZmluZChcIi5pbWFnZS1hZHZhbmNlLWxlZnRcIik7XHJcbiAgICB0aGlzLl8kaW1hZ2VSaWdodCA9IHRoaXMuXyRtb2RhbC5maW5kKFwiLmltYWdlLWFkdmFuY2UtcmlnaHRcIik7XHJcblxyXG4gICAgdGhpcy5faW5kZXggPSAwOyAvLyBJbmRleCBvZiBzZWxlY3RlZCBpbWFnZVxyXG4gICAgdGhpcy5faXNPcGVuID0gZmFsc2U7XHJcbiAgICBcclxuICAgIHRoaXMuXyRpbWFnZUxlZnQub24oXCJjbGlja1wiLCB0aGlzLmFkdmFuY2VMZWZ0LmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5fJGltYWdlUmlnaHQub24oXCJjbGlja1wiLCB0aGlzLmFkdmFuY2VSaWdodC5iaW5kKHRoaXMpKTtcclxuICAgICQoZG9jdW1lbnQpLm9uKFwia2V5ZG93blwiLCB0aGlzLl9vbktleURvd24uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLy8gR2l2ZSBqUXVlcnkgY29udHJvbCBvdmVyIHNob3dpbmcvaGlkaW5nXHJcbiAgICB0aGlzLl8kbW9kYWwuY3NzKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xyXG4gICAgdGhpcy5fJG1vZGFsLmhpZGUoKTtcclxuXHJcbiAgICAvLyBFdmVudHNcclxuICAgICQod2luZG93KS5vbihcInJlc2l6ZVwiLCB0aGlzLl9vblJlc2l6ZS5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuXyRvdmVybGF5Lm9uKFwiY2xpY2tcIiwgdGhpcy5jbG9zZS5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuXyRtb2RhbC5maW5kKFwiLm1vZGFsLWNsb3NlXCIpLm9uKFwiY2xpY2tcIiwgdGhpcy5jbG9zZS5iaW5kKHRoaXMpKTtcclxuICAgIFxyXG4gICAgdGhpcy5fdXBkYXRlQ29udHJvbHMoKTtcclxuXHJcbiAgICAvLyBTaXplIG9mIGZvbnRhd2Vzb21lIGljb25zIG5lZWRzIGEgc2xpZ2h0IGRlbGF5ICh1bnRpbCBzdGFjayBpcyBjbGVhcikgZm9yXHJcbiAgICAvLyBzb21lIHJlYXNvblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5fb25SZXNpemUoKTtcclxuICAgIH0uYmluZCh0aGlzKSwgMCk7XHJcbn1cclxuXHJcblNsaWRlc2hvd01vZGFsLnByb3RvdHlwZS5hZHZhbmNlTGVmdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuc2hvd0ltYWdlQXQodGhpcy5faW5kZXggLSAxKTtcclxufTtcclxuXHJcblNsaWRlc2hvd01vZGFsLnByb3RvdHlwZS5hZHZhbmNlUmlnaHQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLnNob3dJbWFnZUF0KHRoaXMuX2luZGV4ICsgMSk7XHJcbn07XHJcblxyXG5TbGlkZXNob3dNb2RhbC5wcm90b3R5cGUuc2hvd0ltYWdlQXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcclxuICAgIGluZGV4ID0gTWF0aC5tYXgoaW5kZXgsIDApO1xyXG4gICAgaW5kZXggPSBNYXRoLm1pbihpbmRleCwgdGhpcy5fc2xpZGVzaG93LmdldE51bUltYWdlcygpIC0gMSk7XHJcbiAgICB0aGlzLl9pbmRleCA9IGluZGV4O1xyXG4gICAgdmFyICRpbWcgPSB0aGlzLl9zbGlkZXNob3cuZ2V0R2FsbGVyeUltYWdlKHRoaXMuX2luZGV4KTtcclxuICAgIHZhciBjYXB0aW9uID0gdGhpcy5fc2xpZGVzaG93LmdldENhcHRpb24odGhpcy5faW5kZXgpO1xyXG5cclxuICAgIHRoaXMuXyRpbWFnZUNvbnRhaW5lci5lbXB0eSgpO1xyXG4gICAgJChcIjxpbWc+XCIsIHtzcmM6ICRpbWcuYXR0cihcInNyY1wiKX0pXHJcbiAgICAgICAgLmFwcGVuZFRvKHRoaXMuXyRpbWFnZUNvbnRhaW5lcik7XHJcblxyXG4gICAgdGhpcy5fJGNhcHRpb24uZW1wdHkoKTtcclxuICAgIGlmIChjYXB0aW9uKSB7XHJcbiAgICAgICAgJChcIjxzcGFuPlwiKS5hZGRDbGFzcyhcImZpZ3VyZS1udW1iZXJcIilcclxuICAgICAgICAgICAgLnRleHQoXCJGaWcuIFwiICsgKHRoaXMuX2luZGV4ICsgMSkgKyBcIjogXCIpXHJcbiAgICAgICAgICAgIC5hcHBlbmRUbyh0aGlzLl8kY2FwdGlvbik7XHJcbiAgICAgICAgJChcIjxzcGFuPlwiKS5hZGRDbGFzcyhcImNhcHRpb24tdGV4dFwiKVxyXG4gICAgICAgICAgICAudGV4dChjYXB0aW9uKVxyXG4gICAgICAgICAgICAuYXBwZW5kVG8odGhpcy5fJGNhcHRpb24pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0aGlzLl9vblJlc2l6ZSgpO1xyXG4gICAgdGhpcy5fdXBkYXRlQ29udHJvbHMoKTtcclxufTtcclxuXHJcblNsaWRlc2hvd01vZGFsLnByb3RvdHlwZS5vcGVuID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICBpbmRleCA9IGluZGV4IHx8IDA7XHJcbiAgICB0aGlzLl8kbW9kYWwuc2hvdygpO1xyXG4gICAgdGhpcy5zaG93SW1hZ2VBdChpbmRleCk7XHJcbiAgICB0aGlzLl9pc09wZW4gPSB0cnVlO1xyXG59O1xyXG5cclxuU2xpZGVzaG93TW9kYWwucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5fJG1vZGFsLmhpZGUoKTtcclxuICAgIHRoaXMuX2lzT3BlbiA9IGZhbHNlO1xyXG59O1xyXG5cclxuU2xpZGVzaG93TW9kYWwucHJvdG90eXBlLl9vbktleURvd24gPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYgKCF0aGlzLl9pc09wZW4pIHJldHVybjtcclxuICAgIGlmIChlLndoaWNoID09PSBLRVlfQ09ERVMuTEVGVF9BUlJPVykge1xyXG4gICAgICAgIHRoaXMuYWR2YW5jZUxlZnQoKTtcclxuICAgIH0gZWxzZSBpZiAoZS53aGljaCA9PT0gS0VZX0NPREVTLlJJR0hUX0FSUk9XKSB7XHJcbiAgICAgICAgdGhpcy5hZHZhbmNlUmlnaHQoKTtcclxuICAgIH0gZWxzZSBpZiAoZS53aGljaCA9PT0gS0VZX0NPREVTLkVTQ0FQRSkge1xyXG4gICAgICAgIHRoaXMuY2xvc2UoKTsgICBcclxuICAgIH1cclxufTtcclxuXHJcblNsaWRlc2hvd01vZGFsLnByb3RvdHlwZS5fdXBkYXRlQ29udHJvbHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBSZS1lbmFibGVcclxuICAgIHRoaXMuXyRpbWFnZVJpZ2h0LnJlbW92ZUNsYXNzKFwiZGlzYWJsZWRcIik7XHJcbiAgICB0aGlzLl8kaW1hZ2VMZWZ0LnJlbW92ZUNsYXNzKFwiZGlzYWJsZWRcIik7XHJcbiAgICBcclxuICAgIC8vIERpc2FibGUgaWYgd2UndmUgcmVhY2hlZCB0aGUgdGhlIG1heCBvciBtaW4gbGltaXRcclxuICAgIGlmICh0aGlzLl9pbmRleCA+PSAodGhpcy5fc2xpZGVzaG93LmdldE51bUltYWdlcygpIC0gMSkpIHtcclxuICAgICAgICB0aGlzLl8kaW1hZ2VSaWdodC5hZGRDbGFzcyhcImRpc2FibGVkXCIpO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLl9pbmRleCA8PSAwKSB7XHJcbiAgICAgICAgdGhpcy5fJGltYWdlTGVmdC5hZGRDbGFzcyhcImRpc2FibGVkXCIpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU2xpZGVzaG93TW9kYWwucHJvdG90eXBlLl9vblJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciAkaW1hZ2UgPSB0aGlzLl8kaW1hZ2VDb250YWluZXIuZmluZChcImltZ1wiKTtcclxuXHJcbiAgICAvLyBSZXNldCB0aGUgY29udGVudCdzIHdpZHRoXHJcbiAgICB0aGlzLl8kY29udGVudC53aWR0aChcIlwiKTtcclxuXHJcbiAgICAvLyBGaW5kIHRoZSBzaXplIG9mIHRoZSBjb21wb25lbnRzIHRoYXQgbmVlZCB0byBiZSBkaXNwbGF5ZWQgaW4gYWRkaXRpb24gdG8gXHJcbiAgICAvLyB0aGUgaW1hZ2VcclxuICAgIHZhciBjb250cm9sc1dpZHRoID0gdGhpcy5fJGltYWdlTGVmdC5vdXRlcldpZHRoKHRydWUpICsgXHJcbiAgICAgICAgdGhpcy5fJGltYWdlUmlnaHQub3V0ZXJXaWR0aCh0cnVlKTtcclxuICAgIC8vIEhhY2sgZm9yIG5vdyAtIGJ1ZGdldCBmb3IgMnggdGhlIGNhcHRpb24gaGVpZ2h0LiBcclxuICAgIHZhciBjYXB0aW9uSGVpZ2h0ID0gMiAqIHRoaXMuXyRjYXB0aW9uLm91dGVySGVpZ2h0KHRydWUpOyBcclxuICAgIHZhciBpbWFnZVBhZGRpbmcgPSAkaW1hZ2UuaW5uZXJXaWR0aCgpO1xyXG5cclxuICAgIC8vIENhbGN1bGF0ZSB0aGUgYXZhaWxhYmxlIGFyZWEgZm9yIHRoZSBtb2RhbFxyXG4gICAgdmFyIG13ID0gdGhpcy5fJG1vZGFsLndpZHRoKCkgLSBjb250cm9sc1dpZHRoO1xyXG4gICAgdmFyIG1oID0gdGhpcy5fJG1vZGFsLmhlaWdodCgpIC0gY2FwdGlvbkhlaWdodDtcclxuXHJcbiAgICAvLyBGaXQgdGhlIGltYWdlIHRvIHRoZSByZW1haW5pbmcgc2NyZWVuIHJlYWwgZXN0YXRlIFxyXG4gICAgdmFyIHNldFNpemUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGl3ID0gJGltYWdlLnByb3AoXCJuYXR1cmFsV2lkdGhcIik7XHJcbiAgICAgICAgdmFyIGloID0gJGltYWdlLnByb3AoXCJuYXR1cmFsSGVpZ2h0XCIpO1xyXG4gICAgICAgIHZhciBzdyA9IGl3IC8gbXc7XHJcbiAgICAgICAgdmFyIHNoID0gaWggLyBtaDtcclxuICAgICAgICB2YXIgcyA9IE1hdGgubWF4KHN3LCBzaCk7XHJcblxyXG4gICAgICAgIC8vIFNldCB3aWR0aC9oZWlnaHQgdXNpbmcgQ1NTIGluIG9yZGVyIHRvIHJlc3BlY3QgYm94LXNpemluZ1xyXG4gICAgICAgIGlmIChzID4gMSkge1xyXG4gICAgICAgICAgICAkaW1hZ2UuY3NzKFwid2lkdGhcIiwgaXcgLyBzICsgXCJweFwiKTtcclxuICAgICAgICAgICAgJGltYWdlLmNzcyhcImhlaWdodFwiLCBpaCAvIHMgKyBcInB4XCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICRpbWFnZS5jc3MoXCJ3aWR0aFwiLCBpdyArIFwicHhcIik7XHJcbiAgICAgICAgICAgICRpbWFnZS5jc3MoXCJoZWlnaHRcIiwgaWggKyBcInB4XCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fJGltYWdlUmlnaHQuY3NzKFwidG9wXCIsICRpbWFnZS5vdXRlckhlaWdodCgpIC8gMiArIFwicHhcIik7XHJcbiAgICAgICAgdGhpcy5fJGltYWdlTGVmdC5jc3MoXCJ0b3BcIiwgJGltYWdlLm91dGVySGVpZ2h0KCkgLyAyICsgXCJweFwiKTtcclxuXHJcbiAgICAgICAgLy8gU2V0IHRoZSBjb250ZW50IHdyYXBwZXIgdG8gYmUgdGhlIHdpZHRoIG9mIHRoZSBpbWFnZS4gVGhpcyB3aWxsIGtlZXAgXHJcbiAgICAgICAgLy8gdGhlIGNhcHRpb24gZnJvbSBleHBhbmRpbmcgYmV5b25kIHRoZSBpbWFnZS5cclxuICAgICAgICB0aGlzLl8kY29udGVudC53aWR0aCgkaW1hZ2Uub3V0ZXJXaWR0aCh0cnVlKSk7ICAgICAgICBcclxuICAgIH0uYmluZCh0aGlzKTtcclxuXHJcbiAgICBpZiAoJGltYWdlLnByb3AoXCJjb21wbGV0ZVwiKSkgc2V0U2l6ZSgpO1xyXG4gICAgZWxzZSAkaW1hZ2Uub25lKFwibG9hZFwiLCBzZXRTaXplKTtcclxufTtcclxuIiwidmFyIFNsaWRlc2hvd01vZGFsID0gcmVxdWlyZShcIi4vc2xpZGVzaG93LW1vZGFsLmpzXCIpO1xyXG52YXIgVGh1bWJuYWlsU2xpZGVyID0gcmVxdWlyZShcIi4vdGh1bWJuYWlsLXNsaWRlci5qc1wiKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgaW5pdDogZnVuY3Rpb24odHJhbnNpdGlvbkR1cmF0aW9uKSB7XHJcbiAgICAgICAgdHJhbnNpdGlvbkR1cmF0aW9uID0gKHRyYW5zaXRpb25EdXJhdGlvbiAhPT0gdW5kZWZpbmVkKSA/XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb25EdXJhdGlvbiA6IDQwMDtcclxuICAgICAgICB0aGlzLl9zbGlkZXNob3dzID0gW107XHJcbiAgICAgICAgJChcIi5zbGlkZXNob3dcIikuZWFjaChmdW5jdGlvbiAoaW5kZXgsIGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgdmFyIHNsaWRlc2hvdyA9IG5ldyBTbGlkZXNob3coJChlbGVtZW50KSwgdHJhbnNpdGlvbkR1cmF0aW9uKTtcclxuICAgICAgICAgICAgdGhpcy5fc2xpZGVzaG93cy5wdXNoKHNsaWRlc2hvdyk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIFNsaWRlc2hvdygkY29udGFpbmVyLCB0cmFuc2l0aW9uRHVyYXRpb24pIHtcclxuICAgIHRoaXMuX3RyYW5zaXRpb25EdXJhdGlvbiA9IHRyYW5zaXRpb25EdXJhdGlvbjtcclxuICAgIHRoaXMuXyRjb250YWluZXIgPSAkY29udGFpbmVyO1xyXG4gICAgdGhpcy5faW5kZXggPSAwOyAvLyBJbmRleCBvZiBzZWxlY3RlZCBpbWFnZVxyXG5cclxuICAgIC8vIENyZWF0ZSBjb21wb25lbnRzXHJcbiAgICB0aGlzLl90aHVtYm5haWxTbGlkZXIgPSBuZXcgVGh1bWJuYWlsU2xpZGVyKCRjb250YWluZXIsIHRoaXMpO1xyXG4gICAgdGhpcy5fbW9kYWwgPSBuZXcgU2xpZGVzaG93TW9kYWwoJGNvbnRhaW5lciwgdGhpcyk7XHJcblxyXG4gICAgLy8gQ2FjaGUgYW5kIGNyZWF0ZSBuZWNlc3NhcnkgRE9NIGVsZW1lbnRzICAgXHJcbiAgICB0aGlzLl8kY2FwdGlvbkNvbnRhaW5lciA9ICRjb250YWluZXIuZmluZChcIi5jYXB0aW9uXCIpO1xyXG4gICAgdGhpcy5fJHNlbGVjdGVkSW1hZ2VDb250YWluZXIgPSAkY29udGFpbmVyLmZpbmQoXCIuc2VsZWN0ZWQtaW1hZ2VcIik7XHJcblxyXG4gICAgLy8gT3BlbiBtb2RhbCBvbiBjbGlja2luZyBzZWxlY3RlZCBpbWFnZVxyXG4gICAgdGhpcy5fJHNlbGVjdGVkSW1hZ2VDb250YWluZXIub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5fbW9kYWwub3Blbih0aGlzLl9pbmRleCk7ICAgIFxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvLyBMb2FkIGltYWdlc1xyXG4gICAgdGhpcy5fJGdhbGxlcnlJbWFnZXMgPSB0aGlzLl9sb2FkR2FsbGVyeUltYWdlcygpO1xyXG4gICAgdGhpcy5fbnVtSW1hZ2VzID0gdGhpcy5fJGdhbGxlcnlJbWFnZXMubGVuZ3RoO1xyXG5cclxuICAgIC8vIFNob3cgdGhlIGZpcnN0IGltYWdlXHJcbiAgICB0aGlzLnNob3dJbWFnZSgwKTtcclxufVxyXG5cclxuU2xpZGVzaG93LnByb3RvdHlwZS5nZXRBY3RpdmVJbmRleCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLl9pbmRleDtcclxufTtcclxuXHJcblNsaWRlc2hvdy5wcm90b3R5cGUuZ2V0TnVtSW1hZ2VzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX251bUltYWdlcztcclxufTtcclxuXHJcblNsaWRlc2hvdy5wcm90b3R5cGUuZ2V0R2FsbGVyeUltYWdlID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICByZXR1cm4gdGhpcy5fJGdhbGxlcnlJbWFnZXNbaW5kZXhdO1xyXG59O1xyXG5cclxuU2xpZGVzaG93LnByb3RvdHlwZS5nZXRDYXB0aW9uID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICByZXR1cm4gdGhpcy5fJGdhbGxlcnlJbWFnZXNbaW5kZXhdLmRhdGEoXCJjYXB0aW9uXCIpO1xyXG59O1xyXG5cclxuU2xpZGVzaG93LnByb3RvdHlwZS5zaG93SW1hZ2UgPSBmdW5jdGlvbiAoaW5kZXgpIHtcclxuICAgIC8vIFJlc2V0IGFsbCBpbWFnZXMgdG8gaW52aXNpYmxlIGFuZCBsb3dlc3Qgei1pbmRleC4gVGhpcyBjb3VsZCBiZSBzbWFydGVyLFxyXG4gICAgLy8gbGlrZSBIb3ZlclNsaWRlc2hvdywgYW5kIG9ubHkgcmVzZXQgZXhhY3RseSB3aGF0IHdlIG5lZWQsIGJ1dCB3ZSBhcmVuJ3QgXHJcbiAgICAvLyB3YXN0aW5nIHRoYXQgbWFueSBjeWNsZXMuXHJcbiAgICB0aGlzLl8kZ2FsbGVyeUltYWdlcy5mb3JFYWNoKGZ1bmN0aW9uICgkZ2FsbGVyeUltYWdlKSB7XHJcbiAgICAgICAgJGdhbGxlcnlJbWFnZS5jc3Moe1xyXG4gICAgICAgICAgICBcInpJbmRleFwiOiAwLFxyXG4gICAgICAgICAgICBcIm9wYWNpdHlcIjogMFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRnYWxsZXJ5SW1hZ2UudmVsb2NpdHkoXCJzdG9wXCIpOyAvLyBTdG9wIGFueSBhbmltYXRpb25zXHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAvLyBDYWNoZSByZWZlcmVuY2VzIHRvIHRoZSBsYXN0IGFuZCBjdXJyZW50IGltYWdlXHJcbiAgICB2YXIgJGxhc3RJbWFnZSA9IHRoaXMuXyRnYWxsZXJ5SW1hZ2VzW3RoaXMuX2luZGV4XTtcclxuICAgIHZhciAkY3VycmVudEltYWdlID0gdGhpcy5fJGdhbGxlcnlJbWFnZXNbaW5kZXhdO1xyXG4gICAgdGhpcy5faW5kZXggPSBpbmRleDtcclxuXHJcbiAgICAvLyBNYWtlIHRoZSBsYXN0IGltYWdlIHZpc2lzYmxlIGFuZCB0aGVuIGFuaW1hdGUgdGhlIGN1cnJlbnQgaW1hZ2UgaW50byB2aWV3XHJcbiAgICAvLyBvbiB0b3Agb2YgdGhlIGxhc3RcclxuICAgICRsYXN0SW1hZ2UuY3NzKFwiekluZGV4XCIsIDEpO1xyXG4gICAgJGN1cnJlbnRJbWFnZS5jc3MoXCJ6SW5kZXhcIiwgMik7XHJcbiAgICAkbGFzdEltYWdlLmNzcyhcIm9wYWNpdHlcIiwgMSk7XHJcbiAgICAkY3VycmVudEltYWdlLnZlbG9jaXR5KHtcIm9wYWNpdHlcIjogMX0sIHRoaXMuX3RyYW5zaXRpb25EdXJhdGlvbiwgXHJcbiAgICAgICAgXCJlYXNlSW5PdXRRdWFkXCIpO1xyXG5cclxuICAgIC8vIENyZWF0ZSB0aGUgY2FwdGlvbiwgaWYgaXQgZXhpc3RzIG9uIHRoZSB0aHVtYm5haWxcclxuICAgIHZhciBjYXB0aW9uID0gJGN1cnJlbnRJbWFnZS5kYXRhKFwiY2FwdGlvblwiKTtcclxuICAgIGlmIChjYXB0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5fJGNhcHRpb25Db250YWluZXIuZW1wdHkoKTtcclxuICAgICAgICAkKFwiPHNwYW4+XCIpLmFkZENsYXNzKFwiZmlndXJlLW51bWJlclwiKVxyXG4gICAgICAgICAgICAudGV4dChcIkZpZy4gXCIgKyAodGhpcy5faW5kZXggKyAxKSArIFwiOiBcIilcclxuICAgICAgICAgICAgLmFwcGVuZFRvKHRoaXMuXyRjYXB0aW9uQ29udGFpbmVyKTtcclxuICAgICAgICAkKFwiPHNwYW4+XCIpLmFkZENsYXNzKFwiY2FwdGlvbi10ZXh0XCIpXHJcbiAgICAgICAgICAgIC50ZXh0KGNhcHRpb24pXHJcbiAgICAgICAgICAgIC5hcHBlbmRUbyh0aGlzLl8kY2FwdGlvbkNvbnRhaW5lcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT2JqZWN0IGltYWdlIGZpdCBwb2x5ZmlsbCBicmVha3MgalF1ZXJ5IGF0dHIoLi4uKSwgc28gZmFsbGJhY2sgdG8ganVzdCBcclxuICAgIC8vIHVzaW5nIGVsZW1lbnQuc3JjXHJcbiAgICAvLyBUT0RPOiBMYXp5IVxyXG4gICAgLy8gaWYgKCRjdXJyZW50SW1hZ2UuZ2V0KDApLnNyYyA9PT0gXCJcIikge1xyXG4gICAgLy8gICAgICRjdXJyZW50SW1hZ2UuZ2V0KDApLnNyYyA9ICRjdXJyZW50SW1hZ2UuZGF0YShcImltYWdlLXVybFwiKTtcclxuICAgIC8vIH1cclxufTtcclxuXHJcblNsaWRlc2hvdy5wcm90b3R5cGUuX2xvYWRHYWxsZXJ5SW1hZ2VzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gQ3JlYXRlIGVtcHR5IGltYWdlcyBpbiB0aGUgZ2FsbGVyeSBmb3IgZWFjaCB0aHVtYm5haWwuIFRoaXMgaGVscHMgdXMgZG9cclxuICAgIC8vIGxhenkgbG9hZGluZyBvZiBnYWxsZXJ5IGltYWdlcyBhbmQgYWxsb3dzIHVzIHRvIGNyb3NzLWZhZGUgaW1hZ2VzLlxyXG4gICAgdmFyICRnYWxsZXJ5SW1hZ2VzID0gW107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX3RodW1ibmFpbFNsaWRlci5nZXROdW1UaHVtYm5haWxzKCk7IGkgKz0gMSkge1xyXG4gICAgICAgIC8vIEdldCB0aGUgdGh1bWJuYWlsIGVsZW1lbnQgd2hpY2ggaGFzIHBhdGggYW5kIGNhcHRpb24gZGF0YVxyXG4gICAgICAgIHZhciAkdGh1bWIgPSB0aGlzLl90aHVtYm5haWxTbGlkZXIuZ2V0JFRodW1ibmFpbChpKTtcclxuXHJcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBpZCBmcm9tIHRoZSBwYXRoIHRvIHRoZSBsYXJnZSBpbWFnZVxyXG4gICAgICAgIHZhciBsYXJnZVBhdGggPSAkdGh1bWIuZGF0YShcImxhcmdlLXBhdGhcIik7XHJcbiAgICAgICAgdmFyIGlkID0gbGFyZ2VQYXRoLnNwbGl0KFwiL1wiKS5wb3AoKS5zcGxpdChcIi5cIilbMF07XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSBhIGdhbGxlcnkgaW1hZ2UgZWxlbWVudFxyXG4gICAgICAgIHZhciAkZ2FsbGVyeUltYWdlID0gJChcIjxpbWc+XCIsIHtpZDogaWR9KVxyXG4gICAgICAgICAgICAuY3NzKHtcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBcImFic29sdXRlXCIsXHJcbiAgICAgICAgICAgICAgICB0b3A6IFwiMHB4XCIsXHJcbiAgICAgICAgICAgICAgICBsZWZ0OiBcIjBweFwiLFxyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcclxuICAgICAgICAgICAgICAgIHpJbmRleDogMFxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZGF0YShcImltYWdlLXVybFwiLCBsYXJnZVBhdGgpICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC5kYXRhKFwiY2FwdGlvblwiLCAkdGh1bWIuZGF0YShcImNhcHRpb25cIikpXHJcbiAgICAgICAgICAgIC5hcHBlbmRUbyh0aGlzLl8kc2VsZWN0ZWRJbWFnZUNvbnRhaW5lcik7XHJcbiAgICAgICAgJGdhbGxlcnlJbWFnZS5nZXQoMCkuc3JjID0gbGFyZ2VQYXRoOyAvLyBUT0RPOiBNYWtlIHRoaXMgbGF6eSFcclxuICAgICAgICAkZ2FsbGVyeUltYWdlcy5wdXNoKCRnYWxsZXJ5SW1hZ2UpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuICRnYWxsZXJ5SW1hZ2VzO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gVGh1bWJuYWlsU2xpZGVyO1xyXG5cclxuZnVuY3Rpb24gVGh1bWJuYWlsU2xpZGVyKCRjb250YWluZXIsIHNsaWRlc2hvdykge1xyXG4gICAgdGhpcy5fJGNvbnRhaW5lciA9ICRjb250YWluZXI7XHJcbiAgICB0aGlzLl9zbGlkZXNob3cgPSBzbGlkZXNob3c7XHJcblxyXG4gICAgdGhpcy5faW5kZXggPSAwOyAvLyBJbmRleCBvZiBzZWxlY3RlZCB0aHVtYm5haWxcclxuICAgIHRoaXMuX3Njcm9sbEluZGV4ID0gMDsgLy8gSW5kZXggb2YgdGhlIHRodW1ibmFpbCB0aGF0IGlzIGN1cnJlbnRseSBjZW50ZXJlZFxyXG5cclxuICAgIC8vIENhY2hlIGFuZCBjcmVhdGUgbmVjZXNzYXJ5IERPTSBlbGVtZW50c1xyXG4gICAgdGhpcy5fJHRodW1ibmFpbENvbnRhaW5lciA9ICRjb250YWluZXIuZmluZChcIi50aHVtYm5haWxzXCIpO1xyXG4gICAgdGhpcy5fJHRodW1ibmFpbEltYWdlcyA9IHRoaXMuXyR0aHVtYm5haWxDb250YWluZXIuZmluZChcImltZ1wiKTtcclxuICAgIHRoaXMuXyR2aXNpYmxlVGh1bWJuYWlsV3JhcCA9ICRjb250YWluZXIuZmluZChcIi52aXNpYmxlLXRodW1ibmFpbHNcIik7XHJcbiAgICB0aGlzLl8kYWR2YW5jZUxlZnQgPSAkY29udGFpbmVyLmZpbmQoXCIudGh1bWJuYWlsLWFkdmFuY2UtbGVmdFwiKTtcclxuICAgIHRoaXMuXyRhZHZhbmNlUmlnaHQgPSAkY29udGFpbmVyLmZpbmQoXCIudGh1bWJuYWlsLWFkdmFuY2UtcmlnaHRcIik7XHJcblxyXG4gICAgLy8gTG9vcCB0aHJvdWdoIHRoZSB0aHVtYm5haWxzLCBnaXZlIHRoZW0gYW4gaW5kZXggZGF0YSBhdHRyaWJ1dGUgYW5kIGNhY2hlXHJcbiAgICAvLyBhIHJlZmVyZW5jZSB0byB0aGVtIGluIGFuIGFycmF5XHJcbiAgICB0aGlzLl8kdGh1bWJuYWlscyA9IFtdO1xyXG4gICAgdGhpcy5fJHRodW1ibmFpbEltYWdlcy5lYWNoKGZ1bmN0aW9uIChpbmRleCwgZWxlbWVudCkge1xyXG4gICAgICAgIHZhciAkdGh1bWJuYWlsID0gJChlbGVtZW50KTtcclxuICAgICAgICAkdGh1bWJuYWlsLmRhdGEoXCJpbmRleFwiLCBpbmRleCk7XHJcbiAgICAgICAgdGhpcy5fJHRodW1ibmFpbHMucHVzaCgkdGh1bWJuYWlsKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLl9udW1JbWFnZXMgPSB0aGlzLl8kdGh1bWJuYWlscy5sZW5ndGg7XHJcblxyXG4gICAgLy8gTGVmdC9yaWdodCBjb250cm9sc1xyXG4gICAgdGhpcy5fJGFkdmFuY2VMZWZ0Lm9uKFwiY2xpY2tcIiwgdGhpcy5hZHZhbmNlTGVmdC5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuXyRhZHZhbmNlUmlnaHQub24oXCJjbGlja1wiLCB0aGlzLmFkdmFuY2VSaWdodC5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvLyBDbGlja2luZyBhIHRodW1ibmFpbFxyXG4gICAgdGhpcy5fJHRodW1ibmFpbEltYWdlcy5vbihcImNsaWNrXCIsIHRoaXMuX29uQ2xpY2suYmluZCh0aGlzKSk7XHJcblxyXG4gICAgdGhpcy5fYWN0aXZhdGVUaHVtYm5haWwoMCk7XHJcblxyXG4gICAgLy8gUmVzaXplXHJcbiAgICAkKHdpbmRvdykub24oXCJyZXNpemVcIiwgdGhpcy5fb25SZXNpemUuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLy8gRm9yIHNvbWUgcmVhc29uLCB0aGUgc2l6aW5nIG9uIHRoZSBjb250cm9scyBpcyBtZXNzZWQgdXAgaWYgaXQgcnVuc1xyXG4gICAgLy8gaW1tZWRpYXRlbHkgLSBkZWxheSBzaXppbmcgdW50aWwgc3RhY2sgaXMgY2xlYXJcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuX29uUmVzaXplKCk7XHJcbiAgICB9LmJpbmQodGhpcyksIDApO1xyXG59XHJcblxyXG5UaHVtYm5haWxTbGlkZXIucHJvdG90eXBlLmdldEFjdGl2ZUluZGV4ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX2luZGV4O1xyXG59O1xyXG5cclxuVGh1bWJuYWlsU2xpZGVyLnByb3RvdHlwZS5nZXROdW1UaHVtYm5haWxzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX251bUltYWdlcztcclxufTtcclxuXHJcblRodW1ibmFpbFNsaWRlci5wcm90b3R5cGUuZ2V0JFRodW1ibmFpbCA9IGZ1bmN0aW9uIChpbmRleCkge1xyXG4gICAgcmV0dXJuIHRoaXMuXyR0aHVtYm5haWxzW2luZGV4XTtcclxufTtcclxuXHJcblRodW1ibmFpbFNsaWRlci5wcm90b3R5cGUuYWR2YW5jZUxlZnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgbmV3SW5kZXggPSB0aGlzLl9zY3JvbGxJbmRleCAtIHRoaXMuX251bVZpc2libGU7XHJcbiAgICBuZXdJbmRleCA9IE1hdGgubWF4KG5ld0luZGV4LCAwKTtcclxuICAgIHRoaXMuX3Njcm9sbFRvVGh1bWJuYWlsKG5ld0luZGV4KTtcclxufTtcclxuXHJcblRodW1ibmFpbFNsaWRlci5wcm90b3R5cGUuYWR2YW5jZVJpZ2h0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIG5ld0luZGV4ID0gdGhpcy5fc2Nyb2xsSW5kZXggKyB0aGlzLl9udW1WaXNpYmxlO1xyXG4gICAgbmV3SW5kZXggPSBNYXRoLm1pbihuZXdJbmRleCwgdGhpcy5fbnVtSW1hZ2VzIC0gMSk7XHJcbiAgICB0aGlzLl9zY3JvbGxUb1RodW1ibmFpbChuZXdJbmRleCk7XHJcbn07XHJcblxyXG5UaHVtYm5haWxTbGlkZXIucHJvdG90eXBlLl9yZXNldFNpemluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIFJlc2V0IHNpemluZyB2YXJpYWJsZXMuIFRoaXMgaW5jbHVkZXMgcmVzZXR0aW5nIGFueSBpbmxpbmUgc3R5bGUgdGhhdCBoYXNcclxuICAgIC8vIGJlZW4gYXBwbGllZCwgc28gdGhhdCBhbnkgc2l6ZSBjYWxjdWxhdGlvbnMgY2FuIGJlIGJhc2VkIG9uIHRoZSBDU1NcclxuICAgIC8vIHN0eWxpbmcuXHJcbiAgICB0aGlzLl8kdGh1bWJuYWlsQ29udGFpbmVyLmNzcyh7XHJcbiAgICAgICAgdG9wOiBcIlwiLCBsZWZ0OiBcIlwiLCB3aWR0aDogXCJcIiwgaGVpZ2h0OiBcIlwiXHJcbiAgICB9KTtcclxuICAgIHRoaXMuXyR2aXNpYmxlVGh1bWJuYWlsV3JhcC53aWR0aChcIlwiKTtcclxuICAgIHRoaXMuXyR2aXNpYmxlVGh1bWJuYWlsV3JhcC5oZWlnaHQoXCJcIik7XHJcbiAgICAvLyBNYWtlIGFsbCB0aHVtYm5haWxzIHNxdWFyZSBhbmQgcmVzZXQgYW55IGhlaWdodFxyXG4gICAgdGhpcy5fJHRodW1ibmFpbHMuZm9yRWFjaChmdW5jdGlvbiAoJGVsZW1lbnQpIHsgXHJcbiAgICAgICAgJGVsZW1lbnQuaGVpZ2h0KFwiXCIpOyAvLyBSZXNldCBoZWlnaHQgYmVmb3JlIHNldHRpbmcgd2lkdGhcclxuICAgICAgICAkZWxlbWVudC53aWR0aCgkZWxlbWVudC5oZWlnaHQoKSk7XHJcbiAgICB9KTtcclxufTtcclxuXHJcblRodW1ibmFpbFNsaWRlci5wcm90b3R5cGUuX29uUmVzaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5fcmVzZXRTaXppbmcoKTtcclxuXHJcbiAgICAvLyBDYWxjdWxhdGUgdGhlIHNpemUgb2YgdGhlIGZpcnN0IHRodW1ibmFpbC4gVGhpcyBhc3N1bWVzIHRoZSBmaXJzdCBpbWFnZVxyXG4gICAgLy8gb25seSBoYXMgYSByaWdodC1zaWRlIG1hcmdpbi5cclxuICAgIHZhciAkZmlyc3RUaHVtYiA9IHRoaXMuXyR0aHVtYm5haWxzWzBdO1xyXG4gICAgdmFyIHRodW1iU2l6ZSA9ICRmaXJzdFRodW1iLm91dGVySGVpZ2h0KGZhbHNlKTtcclxuICAgIHZhciB0aHVtYk1hcmdpbiA9IDIgKiAoJGZpcnN0VGh1bWIub3V0ZXJXaWR0aCh0cnVlKSAtIHRodW1iU2l6ZSk7XHJcblxyXG4gICAgLy8gTWVhc3VyZSBjb250cm9scy4gVGhleSBuZWVkIHRvIGJlIHZpc2libGUgaW4gb3JkZXIgdG8gYmUgbWVhc3VyZWQuXHJcbiAgICB0aGlzLl8kYWR2YW5jZVJpZ2h0LmNzcyhcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcclxuICAgIHRoaXMuXyRhZHZhbmNlTGVmdC5jc3MoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XHJcbiAgICB2YXIgdGh1bWJDb250cm9sV2lkdGggPSB0aGlzLl8kYWR2YW5jZVJpZ2h0Lm91dGVyV2lkdGgodHJ1ZSkgK1xyXG4gICAgICAgIHRoaXMuXyRhZHZhbmNlTGVmdC5vdXRlcldpZHRoKHRydWUpO1xyXG5cclxuICAgIC8vIENhbGN1bGF0ZSBob3cgbWFueSB0aHVtYm5haWxzIGNhbiBmaXQgd2l0aGluIHRoZSB0aHVtYm5haWwgYXJlYVxyXG4gICAgdmFyIHZpc2libGVXaWR0aCA9IHRoaXMuXyR2aXNpYmxlVGh1bWJuYWlsV3JhcC5vdXRlcldpZHRoKGZhbHNlKTtcclxuICAgIHZhciBudW1UaHVtYnNWaXNpYmxlID0gKHZpc2libGVXaWR0aCAtIHRodW1iTWFyZ2luKSAvIFxyXG4gICAgICAgICh0aHVtYlNpemUgKyB0aHVtYk1hcmdpbik7XHJcblxyXG4gICAgLy8gQ2hlY2sgd2hldGhlciBhbGwgdGhlIHRodW1ibmFpbHMgY2FuIGZpdCBvbiB0aGUgc2NyZWVuIGF0IG9uY2VcclxuICAgIGlmIChudW1UaHVtYnNWaXNpYmxlIDwgdGhpcy5fbnVtSW1hZ2VzKSB7XHJcbiAgICAgICAgdGhpcy5fYWxsVGh1bWJuYWlsU2xpZGVyVmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIC8vIFRha2UgYSBiZXN0IGd1ZXNzIGF0IGhvdyB0byBzaXplIHRoZSB0aHVtYm5haWxzLiBTaXplIGZvcm11bGE6XHJcbiAgICAgICAgLy8gIHdpZHRoID0gbnVtICogdGh1bWJTaXplICsgKG51bSAtIDEpICogdGh1bWJNYXJnaW4gKyBjb250cm9sU2l6ZVxyXG4gICAgICAgIC8vIFNvbHZlIGZvciBudW1iZXIgb2YgdGh1bWJuYWlscyBhbmQgcm91bmQgdG8gdGhlIG5lYXJlc3QgaW50ZWdlciBzbyBcclxuICAgICAgICAvLyB0aGF0IHdlIGRvbid0IGhhdmUgYW55IHBhcnRpYWwgdGh1bWJuYWlscyBzaG93aW5nLlxyXG4gICAgICAgIG51bVRodW1ic1Zpc2libGUgPSBNYXRoLnJvdW5kKFxyXG4gICAgICAgICAgICAodmlzaWJsZVdpZHRoIC0gdGh1bWJDb250cm9sV2lkdGggKyB0aHVtYk1hcmdpbikgLyBcclxuICAgICAgICAgICAgKHRodW1iU2l6ZSArIHRodW1iTWFyZ2luKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIC8vIFVzZSB0aGlzIG51bWJlciBvZiB0aHVtYm5haWxzIHRvIGNhbGN1bGF0ZSB0aGUgdGh1bWJuYWlsIHNpemVcclxuICAgICAgICB2YXIgbmV3U2l6ZSA9ICh2aXNpYmxlV2lkdGggLSB0aHVtYkNvbnRyb2xXaWR0aCArIHRodW1iTWFyZ2luKSAvIFxyXG4gICAgICAgICAgICBudW1UaHVtYnNWaXNpYmxlIC0gdGh1bWJNYXJnaW47XHJcbiAgICAgICAgdGhpcy5fJHRodW1ibmFpbHMuZm9yRWFjaChmdW5jdGlvbiAoJGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgLy8gJC53aWR0aCBhbmQgJC5oZWlnaHQgc2V0IHRoZSBjb250ZW50IHNpemUgcmVnYXJkbGVzcyBvZiB0aGUgXHJcbiAgICAgICAgICAgIC8vIGJveC1zaXppbmcuIFRoZSBpbWFnZXMgYXJlIGJvcmRlci1ib3gsIHNvIHdlIHdhbnQgdGhlIENTUyB3aWR0aFxyXG4gICAgICAgICAgICAvLyBhbmQgaGVpZ2h0LiBUaGlzIGFsbG93cyB0aGUgYWN0aXZlIGltYWdlIHRvIGhhdmUgYSBib3JkZXIgYW5kIHRoZVxyXG4gICAgICAgICAgICAvLyBvdGhlciBpbWFnZXMgdG8gaGF2ZSBwYWRkaW5nLiBcclxuICAgICAgICAgICAgJGVsZW1lbnQuY3NzKFwid2lkdGhcIiwgbmV3U2l6ZSArIFwicHhcIik7XHJcbiAgICAgICAgICAgICRlbGVtZW50LmNzcyhcImhlaWdodFwiLCBuZXdTaXplICsgXCJweFwiKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gU2V0IHRoZSB0aHVtYm5haWwgd3JhcCBzaXplLiBJdCBzaG91bGQgYmUganVzdCB0YWxsIGVub3VnaCB0byBmaXQgYVxyXG4gICAgICAgIC8vIHRodW1ibmFpbCBhbmQgbG9uZyBlbm91Z2ggdG8gaG9sZCBhbGwgdGhlIHRodW1ibmFpbHMgaW4gb25lIGxpbmU6XHJcbiAgICAgICAgdmFyIHRvdGFsU2l6ZSA9IG5ld1NpemUgKiB0aGlzLl9udW1JbWFnZXMgKyBcclxuICAgICAgICAgICAgdGh1bWJNYXJnaW4gKiAodGhpcy5fbnVtSW1hZ2VzIC0gMSk7XHJcbiAgICAgICAgdGhpcy5fJHRodW1ibmFpbENvbnRhaW5lci5jc3Moe1xyXG4gICAgICAgICAgICB3aWR0aDogdG90YWxTaXplICsgXCJweFwiLFxyXG4gICAgICAgICAgICBoZWlnaHQ6ICRmaXJzdFRodW1iLm91dGVySGVpZ2h0KHRydWUpICsgXCJweFwiXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFNldCB0aGUgdmlzaWJsZSB0aHVtYm5haWwgd3JhcCBzaXplLiBUaGlzIGlzIHVzZWQgdG8gbWFrcyB0aGUgbXVjaCBcclxuICAgICAgICAvLyBsYXJnZXIgdGh1bWJuYWlsIGNvbnRhaW5lci4gSXQgc2hvdWxkIGJlIGFzIHdpZGUgYXMgaXQgY2FuIGJlLCBtaW51c1xyXG4gICAgICAgIC8vIHRoZSBzcGFjZSBuZWVkZWQgZm9yIHRoZSBsZWZ0L3JpZ2h0IGNvbnRvbHMuXHJcbiAgICAgICAgdGhpcy5fJHZpc2libGVUaHVtYm5haWxXcmFwLmNzcyh7XHJcbiAgICAgICAgICAgIHdpZHRoOiB2aXNpYmxlV2lkdGggLSB0aHVtYkNvbnRyb2xXaWR0aCArIFwicHhcIixcclxuICAgICAgICAgICAgaGVpZ2h0OiAkZmlyc3RUaHVtYi5vdXRlckhlaWdodCh0cnVlKSArIFwicHhcIlxyXG4gICAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBBbGwgdGh1bWJuYWlscyBhcmUgdmlzaWJsZSwgd2UgY2FuIGhpZGUgdGhlIGNvbnRyb2xzIGFuZCBleHBhbmQgdGhlXHJcbiAgICAgICAgLy8gdGh1bWJuYWlsIGNvbnRhaW5lciB0byAxMDAlXHJcbiAgICAgICAgdGhpcy5fYWxsVGh1bWJuYWlsU2xpZGVyVmlzaWJsZSA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5fJHRodW1ibmFpbENvbnRhaW5lci5jc3MoXCJ3aWR0aFwiLCBcIjEwMCVcIik7XHJcbiAgICAgICAgdGhpcy5fJGFkdmFuY2VSaWdodC5jc3MoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcclxuICAgICAgICB0aGlzLl8kYWR2YW5jZUxlZnQuY3NzKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fbnVtVmlzaWJsZSA9IG51bVRodW1ic1Zpc2libGU7XHJcbiAgICB2YXIgbWlkZGxlSW5kZXggPSBNYXRoLmZsb29yKCh0aGlzLl9udW1WaXNpYmxlIC0gMSkgLyAyKTtcclxuICAgIHRoaXMuX3Njcm9sbEJvdW5kcyA9IHtcclxuICAgICAgICBtaW46IG1pZGRsZUluZGV4LFxyXG4gICAgICAgIG1heDogdGhpcy5fbnVtSW1hZ2VzIC0gMSAtIG1pZGRsZUluZGV4XHJcbiAgICB9O1xyXG4gICAgaWYgKHRoaXMuX251bVZpc2libGUgJSAyID09PSAwKSB0aGlzLl9zY3JvbGxCb3VuZHMubWF4IC09IDE7XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlVGh1bWJuYWlsQ29udHJvbHMoKTtcclxufTtcclxuXHJcblRodW1ibmFpbFNsaWRlci5wcm90b3R5cGUuX2FjdGl2YXRlVGh1bWJuYWlsID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAvLyBBY3RpdmF0ZS9kZWFjdGl2YXRlIHRodW1ibmFpbHNcclxuICAgIHRoaXMuXyR0aHVtYm5haWxzW3RoaXMuX2luZGV4XS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcclxuICAgIHRoaXMuXyR0aHVtYm5haWxzW2luZGV4XS5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcclxufTtcclxuXHJcblRodW1ibmFpbFNsaWRlci5wcm90b3R5cGUuX3Njcm9sbFRvVGh1bWJuYWlsID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAvLyBDb25zdHJhaW4gaW5kZXggc28gdGhhdCB3ZSBjYW4ndCBzY3JvbGwgb3V0IG9mIGJvdW5kcyBcclxuICAgIGluZGV4ID0gTWF0aC5tYXgoaW5kZXgsIHRoaXMuX3Njcm9sbEJvdW5kcy5taW4pO1xyXG4gICAgaW5kZXggPSBNYXRoLm1pbihpbmRleCwgdGhpcy5fc2Nyb2xsQm91bmRzLm1heCk7XHJcbiAgICB0aGlzLl9zY3JvbGxJbmRleCA9IGluZGV4O1xyXG4gICAgXHJcbiAgICAvLyBGaW5kIHRoZSBcImxlZnRcIiBwb3NpdGlvbiBvZiB0aGUgdGh1bWJuYWlsIGNvbnRhaW5lciB0aGF0IHdvdWxkIHB1dCB0aGUgXHJcbiAgICAvLyB0aHVtYm5haWwgYXQgaW5kZXggYXQgdGhlIGNlbnRlclxyXG4gICAgdmFyICR0aHVtYiA9IHRoaXMuXyR0aHVtYm5haWxzWzBdO1xyXG4gICAgdmFyIHNpemUgPSBwYXJzZUZsb2F0KCR0aHVtYi5jc3MoXCJ3aWR0aFwiKSk7XHJcbiAgICB2YXIgbWFyZ2luID0gMiAqIHBhcnNlRmxvYXQoJHRodW1iLmNzcyhcIm1hcmdpbi1yaWdodFwiKSk7IFxyXG4gICAgdmFyIGNlbnRlclggPSBzaXplICogdGhpcy5fc2Nyb2xsQm91bmRzLm1pbiArIFxyXG4gICAgICAgIG1hcmdpbiAqICh0aGlzLl9zY3JvbGxCb3VuZHMubWluIC0gMSk7XHJcbiAgICB2YXIgdGh1bWJYID0gc2l6ZSAqIGluZGV4ICsgbWFyZ2luICogKGluZGV4IC0gMSk7XHJcbiAgICB2YXIgbGVmdCA9IGNlbnRlclggLSB0aHVtYlg7XHJcblxyXG4gICAgLy8gQW5pbWF0ZSB0aGUgdGh1bWJuYWlsIGNvbnRhaW5lclxyXG4gICAgdGhpcy5fJHRodW1ibmFpbENvbnRhaW5lci52ZWxvY2l0eShcInN0b3BcIik7XHJcbiAgICB0aGlzLl8kdGh1bWJuYWlsQ29udGFpbmVyLnZlbG9jaXR5KHtcclxuICAgICAgICBcImxlZnRcIjogbGVmdCArIFwicHhcIlxyXG4gICAgfSwgNjAwLCBcImVhc2VJbk91dFF1YWRcIik7XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlVGh1bWJuYWlsQ29udHJvbHMoKTtcclxufTtcclxuXHJcblRodW1ibmFpbFNsaWRlci5wcm90b3R5cGUuX29uQ2xpY2sgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgdmFyICR0YXJnZXQgPSAkKGUudGFyZ2V0KTtcclxuICAgIHZhciBpbmRleCA9ICR0YXJnZXQuZGF0YShcImluZGV4XCIpO1xyXG4gICAgXHJcbiAgICAvLyBDbGlja2VkIG9uIHRoZSBhY3RpdmUgaW1hZ2UgLSBubyBuZWVkIHRvIGRvIGFueXRoaW5nXHJcbiAgICBpZiAodGhpcy5faW5kZXggIT09IGluZGV4KSB7XHJcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVUaHVtYm5haWwoaW5kZXgpO1xyXG4gICAgICAgIHRoaXMuX3Njcm9sbFRvVGh1bWJuYWlsKGluZGV4KTtcclxuICAgICAgICB0aGlzLl9pbmRleCA9IGluZGV4O1xyXG4gICAgICAgIHRoaXMuX3NsaWRlc2hvdy5zaG93SW1hZ2UoaW5kZXgpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuVGh1bWJuYWlsU2xpZGVyLnByb3RvdHlwZS5fdXBkYXRlVGh1bWJuYWlsQ29udHJvbHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBSZS1lbmFibGVcclxuICAgIHRoaXMuXyRhZHZhbmNlTGVmdC5yZW1vdmVDbGFzcyhcImRpc2FibGVkXCIpO1xyXG4gICAgdGhpcy5fJGFkdmFuY2VSaWdodC5yZW1vdmVDbGFzcyhcImRpc2FibGVkXCIpO1xyXG4gICAgXHJcbiAgICAvLyBEaXNhYmxlIGlmIHdlJ3ZlIHJlYWNoZWQgdGhlIHRoZSBtYXggb3IgbWluIGxpbWl0XHJcbiAgICB2YXIgbWlkU2Nyb2xsSW5kZXggPSBNYXRoLmZsb29yKCh0aGlzLl9udW1WaXNpYmxlIC0gMSkgLyAyKTtcclxuICAgIHZhciBtaW5TY3JvbGxJbmRleCA9IG1pZFNjcm9sbEluZGV4O1xyXG4gICAgdmFyIG1heFNjcm9sbEluZGV4ID0gdGhpcy5fbnVtSW1hZ2VzIC0gMSAtIG1pZFNjcm9sbEluZGV4O1xyXG4gICAgaWYgKHRoaXMuX3Njcm9sbEluZGV4ID49IHRoaXMuX3Njcm9sbEJvdW5kcy5tYXgpIHtcclxuICAgICAgICB0aGlzLl8kYWR2YW5jZVJpZ2h0LmFkZENsYXNzKFwiZGlzYWJsZWRcIik7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMuX3Njcm9sbEluZGV4IDw9IHRoaXMuX3Njcm9sbEJvdW5kcy5taW4pIHtcclxuICAgICAgICB0aGlzLl8kYWR2YW5jZUxlZnQuYWRkQ2xhc3MoXCJkaXNhYmxlZFwiKTtcclxuICAgIH1cclxufTsiXX0=
