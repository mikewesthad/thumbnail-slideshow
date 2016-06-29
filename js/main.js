(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Slideshow = require("./thumbnail-slideshow.js");
slideshow = new Slideshow();

objectFitImages();
smartquotes();
},{"./thumbnail-slideshow.js":3}],2:[function(require,module,exports){
module.exports = SlideshowModal;

var utilities = require("./utilities.js");

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

    setTimeout(function () {
        this._$modal.css("display", "block");
        this._$modal.hide();

        $(window).on("resize", this._onResize.bind(this));
        this._onResize();

        this._updateControls();

        this._$overlay.on("click", this.close.bind(this));
        this._$modal.find(".modal-close").on("click", this.close.bind(this));
    }.bind(this), 0)
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
    var captionHeight = 3 * this._$caption.outerHeight(true); 
    var imagePadding = $image.innerWidth()

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

},{"./utilities.js":4}],3:[function(require,module,exports){
module.exports = ThumbnailSlideshows;

var utilities = require("./utilities.js");
var SlideshowModal = require("./slideshow-modal.js");

function ThumbnailSlideshows(transitionDuration) { 
    transitionDuration = (transitionDuration !== undefined) ?
        transitionDuration : 400;
    this._imageGalleries = [];
    $(".slideshow").each(function (index, element) {
        var gallery = new ThumbnailSlideshow($(element), transitionDuration);
        this._imageGalleries.push(gallery);
    }.bind(this));
}

function ThumbnailSlideshow($container, transitionDuration) {
    this._transitionDuration = transitionDuration;
    this._$container = $container;
    this._index = 0; // Index of selected image

    // Cache and create necessary DOM elements
    this._$thumbnailContainer = $container.find(".thumbnails");
    this._$visibleThumbnailWrap = $container.find(".visible-thumbnails");
    this._$thumbnailLeftControl = $container.find(".thumbnail-advance-left");
    this._$thumbnailRightControl = $container.find(".thumbnail-advance-right");    
    this._$captionContainer = $container.find(".caption");
    this._$selectedImageContainer = $container.find(".selected-image");

    this._$selectedImageContainer.on("click", function (e) {
        var $modalOverlay = $("<div>", {class: "slideshow-modal-overlay"})
            .appendTo($(document.body));
        var $modal = $("<div>", {class: "slideshow-modal"})
            .appendTo($(document.body));
        var $currentImage = this._$galleryImages[this._index];
        var $image = $("<img>", {
            src: $currentImage.attr("src")
        }).appendTo($modal);

        var maxHeight = window.innerHeight * 0.95;
        if ($modal.outerHeight(false) > maxHeight) {
            $modal.css({
                width: "initial",
                height: maxHeight + "px"
            });
            $image.css({
                width: "auto",
                height: "100%"
            });
        }

        $modalOverlay.on("click", function (e) {
            $modal.remove();
            $modalOverlay.remove();
        })

    }.bind(this));

    // Loop through the thumbnails, give them an index data attribute and cache
    // a reference to them in an array
    this._$thumbnails = [];
    this._$thumbnailContainer.find("img").each(function (index, element) {
        var $thumbnail = $(element);
        $thumbnail.data("index", index);
        this._$thumbnails.push($thumbnail);
    }.bind(this));
    this._numThumbnails = this._$thumbnails.length;

    // Create empty images in the gallery for each thumbnail. This helps us do
    // lazy loading of gallery images and allows us to cross-fade images.
    this._$galleryImages = [];
    for (var i = 0; i < this._$thumbnails.length; i += 1) {
        // Calculate the id from the path to the large image
        var largePath = this._$thumbnails[i].data("large-path");
        var id = largePath.split("/").pop().split(".")[0];
        var $galleryImage = $("<img>", {id: id})
            .css({
                position: "absolute",
                top: "0px",
                left: "0px",
                opacity: 0,
                zIndex: 0
            })
            .data("image-url", largePath)
            .appendTo(this._$selectedImageContainer);
        $galleryImage.get(0).src = largePath; // TODO: Make this lazy!
        this._$galleryImages.push($galleryImage);
    }

    this._$thumbnailRightControl.on("click", 
        this._onRightControlClick.bind(this));
    this._$thumbnailLeftControl.on("click", 
        this._onLeftControlClick.bind(this));

    // For some reason, the sizing on the controls is messed up if it runs
    // immediately - delay sizing until stack is clear
    setTimeout(function () {
        this._onResize();
        $(window).on("resize", this._onResize.bind(this));

        this._updateThumbnailControls();

        // Activate the first thumbnail and display it in the gallery 
        this._switchActiveImage(0);

        // Bind the event handlers to the images
        this._$thumbnailContainer.find("img").on("click", this._onClick.bind(this));

        this._modal = new SlideshowModal($container, this);
        
        this._$selectedImageContainer.on("click", function () {
            this._modal.open(this._index);    
        }.bind(this));
    }.bind(this), 0);
}

ThumbnailSlideshow.prototype.getActiveIndex = function () {
    return this._index;
};

ThumbnailSlideshow.prototype.getNumImages = function () {
    return this._numThumbnails;
};

ThumbnailSlideshow.prototype.getGalleryImage = function (index) {
    return this._$galleryImages[index];
};

ThumbnailSlideshow.prototype.getCaption = function (index) {
    return this._$thumbnails[index].data("caption");
};

ThumbnailSlideshow.prototype._onLeftControlClick = function () {
    this._scrollToThumbnail(this._scrollIndex - this._numVisible);
};

ThumbnailSlideshow.prototype._onRightControlClick = function () {
    this._scrollToThumbnail(this._scrollIndex + this._numVisible);
};

ThumbnailSlideshow.prototype._resetSizing = function () {
    // Reset sizing variables. This includes resetting any inline style that has
    // been applied, so that any size calculations can be based on the CSS
    // styling.
    this._$thumbnailContainer.css({
        top: "", left: "", width: "", height: ""
    })
    this._$visibleThumbnailWrap.width("");
    this._$visibleThumbnailWrap.height("");
    // Make all thumbnails square and reset any height
    this._$thumbnails.forEach(function ($element) { 
        $element.height(""); // Reset height before setting width
        $element.width($element.height());
    });
};

ThumbnailSlideshow.prototype._onResize = function () {
    this._resetSizing();

    // Calculate the size of the first thumbnail. This assumes the first image
    // only has a right-side margin.
    var $firstThumb = this._$thumbnails[0];
    var thumbSize = $firstThumb.outerHeight(false);
    var thumbMargin = 2 * ($firstThumb.outerWidth(true) - thumbSize);

    // Measure controls. They need to be visible in order to be measured.
    this._$thumbnailLeftControl.css("display", "block");
    this._$thumbnailRightControl.css("display", "block");
    var thumbControlWidth = this._$thumbnailLeftControl.outerWidth(true) +
        this._$thumbnailRightControl.outerWidth(true);

    // Calculate how many thumbnails can fit within the thumbnail area
    var visibleWidth = this._$visibleThumbnailWrap.outerWidth(false);
    var numThumbsVisible = (visibleWidth - thumbMargin) / 
        (thumbSize + thumbMargin);

    // Check whether all the thumbnails can fit on the screen at once
    if (numThumbsVisible < this._numThumbnails) {
        this._allThumbnailsVisible = false;
        // Take a best guess at how to size the thumbnails. Size formula:
        //  width = num * thumbSize + (num - 1) * thumbMargin + controlSize
        // Solve for number of thumbnails and round to the nearest integer so 
        // that we don't have any partial thumbnails showing.
        numThumbsVisible = Math.round(
            (visibleWidth - thumbControlWidth + thumbMargin) / 
            (thumbSize + thumbMargin)
        );
        this._numVisible = numThumbsVisible;

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
        var totalSize = newSize * this._numThumbnails + 
            thumbMargin * (this._numThumbnails - 1);
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
        this._allThumbnailsVisible = true;        
        this._numVisible = this._numThumbnails;
        this._$thumbnailContainer.css("width", "100%");
        this._$thumbnailLeftControl.css("display", "none");
        this._$thumbnailRightControl.css("display", "none");
    }

    // Calculate the bounds of the scrolling
    this._maxScroll = 0;
    this._minScroll = this._$visibleThumbnailWrap.width() - 
        this._$thumbnailContainer.width();
    this._scrollIndex = 0;
    this._midScrollIndex = Math.floor((this._numVisible - 1) / 2);
    this._minScrollIndex = this._midScrollIndex;
    this._maxScrollIndex = this._numThumbnails - 1 - this._midScrollIndex;
    this._updateThumbnailControls();
};

ThumbnailSlideshow.prototype._switchActiveImage = function (index) {
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

    // Cache references to the last and current image & thumbnails
    var $lastThumbnail = this._$thumbnails[this._index];
    var $lastImage = this._$galleryImages[this._index];
    this._index = index;
    var $currentThumbnail = this._$thumbnails[this._index];
    var $currentImage = this._$galleryImages[this._index];

    // Activate/deactivate thumbnails
    $lastThumbnail.removeClass("active");
    $currentThumbnail.addClass("active");

    this._scrollToThumbnail(this._index);

    // Make the last image visisble and then animate the current image into view
    // on top of the last
    $lastImage.css("zIndex", 1);
    $currentImage.css("zIndex", 2);
    $lastImage.css("opacity", 1);
    $currentImage.velocity({"opacity": 1}, this._transitionDuration, 
        "easeInOutQuad");

    // Create the caption, if it exists on the thumbnail
    var caption = $currentThumbnail.data("caption");
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

ThumbnailSlideshow.prototype._scrollToThumbnail = function (index) {
    // Figure out what we can actually scroll to - we don't want to scroll out
    // of bounds
    index = Math.max(index, this._minScrollIndex);
    index = Math.min(index, this._maxScrollIndex);
    this._scrollIndex = index;

    this._updateThumbnailControls();

    // this._numVisible can be used to figure out which to center
    var thumbSize = parseFloat(this._$thumbnails[0].css("width"));
    var thumbMargin = 2 * parseFloat(this._$thumbnails[0].css("margin-right")); 
    var centerX = thumbSize * this._midScrollIndex + 
        thumbMargin * (this._midScrollIndex - 1);
    var thumbX = thumbSize * index + thumbMargin * (index - 1);

    var left = centerX - thumbX;
    left = Math.min(left, this._maxScroll);
    left = Math.max(left, this._minScroll);

    this._$thumbnailContainer.velocity("stop");
    this._$thumbnailContainer.velocity({
        "left": left + "px"
    }, 600, "easeInOutQuad");
};

ThumbnailSlideshow.prototype._onClick = function (e) {
    var $target = $(e.target);
    var index = $target.data("index");
    
    // Clicked on the active image - no need to do anything
    if (this._index === index) return;

    this._switchActiveImage(index);  
};

ThumbnailSlideshow.prototype._updateThumbnailControls = function () {
    // Re-enable
    this._$thumbnailRightControl.removeClass("disabled");
    this._$thumbnailLeftControl.removeClass("disabled");
    
    // Disable if we've reached the the max or min limit
    if (this._scrollIndex >= this._maxScrollIndex) {
        this._$thumbnailRightControl.addClass("disabled");
    } else if (this._scrollIndex <= this._minScrollIndex) {
        this._$thumbnailLeftControl.addClass("disabled");
    }
};
},{"./slideshow-modal.js":2,"./utilities.js":4}],4:[function(require,module,exports){
exports.default = function (val, defaultVal) {
    return (val !== undefined) ? val : defaultVal;
};

// Untested
// exports.defaultProperties = function defaultProperties (obj, props) {
//     for (var prop in props) {
//         if (props.hasOwnProperty(props, prop)) {
//             var value = exports.defaultValue(props.value, props.default);
//             obj[prop] = value;
//         }
//     }
//     return obj;
// };
// 
exports.timeIt = function (func) {
    var start = performance.now();
    func();
    var end = performance.now();
    return end - start;
};

exports.isInRect = function (x, y, rect) {
    if (x >= rect.x && x <= (rect.x + rect.w) &&
        y >= rect.y && y <= (rect.y + rect.h)) {
        return true;
    }
    return false;
};

exports.randInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

exports.randArrayElement = function (array) {
    var i = exports.randInt(0, array.length - 1);    
    return array[i];
};

exports.map = function (num, min1, max1, min2, max2, options) {
    var mapped = (num - min1) / (max1 - min1) * (max2 - min2) + min2;
    if (!options) return mapped;
    if (options.round && options.round === true) {
        mapped = Math.round(mapped);
    }
    if (options.floor && options.floor === true) {
        mapped = Math.floor(mapped);        
    }
    if (options.ceil && options.ceil === true) {
        mapped = Math.ceil(mapped);        
    }
    if (options.clamp && options.clamp === true) {
        mapped = Math.min(mapped, max2);
        mapped = Math.max(mapped, min2);
    }
    return mapped;
};

exports.getQueryParameters = function () {
    // Check for query string
    qs = window.location.search;
    if (qs.length <= 1) return {};
    // Query string exists, parse it into a query object
    qs = qs.substring(1); // Remove the "?" delimiter
    var keyValPairs = qs.split("&");
    var queryObject = {};
    for (var i = 0; i < keyValPairs.length; i += 1) {
        var keyVal = keyValPairs[i].split("=");
        if (keyVal.length === 2) {
            var key = decodeURIComponent(keyVal[0]);
            var val = decodeURIComponent(keyVal[1]);
            queryObject[key] = val;
        }
    }
    return queryObject;
};

exports.createQueryString = function (queryObject) {
    if (typeof queryObject !== "object") return "";
    var keys = Object.keys(queryObject);
    if (keys.length === 0) return "";
    var queryString = "?";
    for (var i = 0; i < keys.length; i += 1) {
        var key = keys[i];
        var val = queryObject[key];
        queryString += encodeURIComponent(key) + "=" + encodeURIComponent(val);
        if (i !== keys.length - 1) queryString += "&";
    }
    return queryString;
};

exports.wrapIndex = function (index, length) {
    var wrappedIndex = (index % length); 
    if (wrappedIndex < 0) {
        // If negative, flip the index so that -1 becomes the last item in list 
        wrappedIndex = length + wrappedIndex;
    }
    return wrappedIndex;
};

},{}]},{},[1])


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbWFpbi5qcyIsInNyYy9qcy9zbGlkZXNob3ctbW9kYWwuanMiLCJzcmMvanMvdGh1bWJuYWlsLXNsaWRlc2hvdy5qcyIsInNyYy9qcy91dGlsaXRpZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBTbGlkZXNob3cgPSByZXF1aXJlKFwiLi90aHVtYm5haWwtc2xpZGVzaG93LmpzXCIpO1xyXG5zbGlkZXNob3cgPSBuZXcgU2xpZGVzaG93KCk7XHJcblxyXG5vYmplY3RGaXRJbWFnZXMoKTtcclxuc21hcnRxdW90ZXMoKTsiLCJtb2R1bGUuZXhwb3J0cyA9IFNsaWRlc2hvd01vZGFsO1xyXG5cclxudmFyIHV0aWxpdGllcyA9IHJlcXVpcmUoXCIuL3V0aWxpdGllcy5qc1wiKTtcclxuXHJcbnZhciBLRVlfQ09ERVMgPSB7XHJcbiAgICBMRUZUX0FSUk9XOiAzNyxcclxuICAgIFJJR0hUX0FSUk9XOiAzOSxcclxuICAgIEVTQ0FQRTogMjdcclxufTtcclxuXHJcbmZ1bmN0aW9uIFNsaWRlc2hvd01vZGFsKCRjb250YWluZXIsIHNsaWRlc2hvdykge1xyXG4gICAgdGhpcy5fc2xpZGVzaG93ID0gc2xpZGVzaG93O1xyXG5cclxuICAgIHRoaXMuXyRtb2RhbCA9ICRjb250YWluZXIuZmluZChcIi5zbGlkZXNob3ctbW9kYWxcIik7XHJcbiAgICB0aGlzLl8kb3ZlcmxheSA9IHRoaXMuXyRtb2RhbC5maW5kKFwiLm1vZGFsLW92ZXJsYXlcIik7XHJcbiAgICB0aGlzLl8kY29udGVudCA9IHRoaXMuXyRtb2RhbC5maW5kKFwiLm1vZGFsLWNvbnRlbnRzXCIpO1xyXG4gICAgdGhpcy5fJGNhcHRpb24gPSB0aGlzLl8kbW9kYWwuZmluZChcIi5tb2RhbC1jYXB0aW9uXCIpO1xyXG4gICAgdGhpcy5fJGltYWdlQ29udGFpbmVyID0gdGhpcy5fJG1vZGFsLmZpbmQoXCIubW9kYWwtaW1hZ2VcIik7XHJcbiAgICB0aGlzLl8kaW1hZ2VMZWZ0ID0gdGhpcy5fJG1vZGFsLmZpbmQoXCIuaW1hZ2UtYWR2YW5jZS1sZWZ0XCIpO1xyXG4gICAgdGhpcy5fJGltYWdlUmlnaHQgPSB0aGlzLl8kbW9kYWwuZmluZChcIi5pbWFnZS1hZHZhbmNlLXJpZ2h0XCIpO1xyXG5cclxuICAgIHRoaXMuX2luZGV4ID0gMDsgLy8gSW5kZXggb2Ygc2VsZWN0ZWQgaW1hZ2VcclxuICAgIHRoaXMuX2lzT3BlbiA9IGZhbHNlO1xyXG4gICAgXHJcbiAgICB0aGlzLl8kaW1hZ2VMZWZ0Lm9uKFwiY2xpY2tcIiwgdGhpcy5hZHZhbmNlTGVmdC5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuXyRpbWFnZVJpZ2h0Lm9uKFwiY2xpY2tcIiwgdGhpcy5hZHZhbmNlUmlnaHQuYmluZCh0aGlzKSk7XHJcbiAgICAkKGRvY3VtZW50KS5vbihcImtleWRvd25cIiwgdGhpcy5fb25LZXlEb3duLmJpbmQodGhpcykpO1xyXG5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuXyRtb2RhbC5jc3MoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XHJcbiAgICAgICAgdGhpcy5fJG1vZGFsLmhpZGUoKTtcclxuXHJcbiAgICAgICAgJCh3aW5kb3cpLm9uKFwicmVzaXplXCIsIHRoaXMuX29uUmVzaXplLmJpbmQodGhpcykpO1xyXG4gICAgICAgIHRoaXMuX29uUmVzaXplKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX3VwZGF0ZUNvbnRyb2xzKCk7XHJcblxyXG4gICAgICAgIHRoaXMuXyRvdmVybGF5Lm9uKFwiY2xpY2tcIiwgdGhpcy5jbG9zZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB0aGlzLl8kbW9kYWwuZmluZChcIi5tb2RhbC1jbG9zZVwiKS5vbihcImNsaWNrXCIsIHRoaXMuY2xvc2UuYmluZCh0aGlzKSk7XHJcbiAgICB9LmJpbmQodGhpcyksIDApXHJcbn1cclxuXHJcblNsaWRlc2hvd01vZGFsLnByb3RvdHlwZS5hZHZhbmNlTGVmdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuc2hvd0ltYWdlQXQodGhpcy5faW5kZXggLSAxKTtcclxufTtcclxuXHJcblNsaWRlc2hvd01vZGFsLnByb3RvdHlwZS5hZHZhbmNlUmlnaHQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLnNob3dJbWFnZUF0KHRoaXMuX2luZGV4ICsgMSk7XHJcbn07XHJcblxyXG5TbGlkZXNob3dNb2RhbC5wcm90b3R5cGUuc2hvd0ltYWdlQXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcclxuICAgIGluZGV4ID0gTWF0aC5tYXgoaW5kZXgsIDApO1xyXG4gICAgaW5kZXggPSBNYXRoLm1pbihpbmRleCwgdGhpcy5fc2xpZGVzaG93LmdldE51bUltYWdlcygpIC0gMSk7XHJcbiAgICB0aGlzLl9pbmRleCA9IGluZGV4O1xyXG4gICAgdmFyICRpbWcgPSB0aGlzLl9zbGlkZXNob3cuZ2V0R2FsbGVyeUltYWdlKHRoaXMuX2luZGV4KTtcclxuICAgIHZhciBjYXB0aW9uID0gdGhpcy5fc2xpZGVzaG93LmdldENhcHRpb24odGhpcy5faW5kZXgpO1xyXG5cclxuICAgIHRoaXMuXyRpbWFnZUNvbnRhaW5lci5lbXB0eSgpO1xyXG4gICAgJChcIjxpbWc+XCIsIHtzcmM6ICRpbWcuYXR0cihcInNyY1wiKX0pXHJcbiAgICAgICAgLmFwcGVuZFRvKHRoaXMuXyRpbWFnZUNvbnRhaW5lcik7XHJcblxyXG4gICAgdGhpcy5fJGNhcHRpb24uZW1wdHkoKTtcclxuICAgIGlmIChjYXB0aW9uKSB7XHJcbiAgICAgICAgJChcIjxzcGFuPlwiKS5hZGRDbGFzcyhcImZpZ3VyZS1udW1iZXJcIilcclxuICAgICAgICAgICAgLnRleHQoXCJGaWcuIFwiICsgKHRoaXMuX2luZGV4ICsgMSkgKyBcIjogXCIpXHJcbiAgICAgICAgICAgIC5hcHBlbmRUbyh0aGlzLl8kY2FwdGlvbik7XHJcbiAgICAgICAgJChcIjxzcGFuPlwiKS5hZGRDbGFzcyhcImNhcHRpb24tdGV4dFwiKVxyXG4gICAgICAgICAgICAudGV4dChjYXB0aW9uKVxyXG4gICAgICAgICAgICAuYXBwZW5kVG8odGhpcy5fJGNhcHRpb24pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0aGlzLl9vblJlc2l6ZSgpO1xyXG4gICAgdGhpcy5fdXBkYXRlQ29udHJvbHMoKTtcclxufTtcclxuXHJcblNsaWRlc2hvd01vZGFsLnByb3RvdHlwZS5vcGVuID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICBpbmRleCA9IGluZGV4IHx8IDA7XHJcbiAgICB0aGlzLl8kbW9kYWwuc2hvdygpO1xyXG4gICAgdGhpcy5zaG93SW1hZ2VBdChpbmRleCk7XHJcbiAgICB0aGlzLl9pc09wZW4gPSB0cnVlO1xyXG59O1xyXG5cclxuU2xpZGVzaG93TW9kYWwucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5fJG1vZGFsLmhpZGUoKTtcclxuICAgIHRoaXMuX2lzT3BlbiA9IGZhbHNlO1xyXG59O1xyXG5cclxuU2xpZGVzaG93TW9kYWwucHJvdG90eXBlLl9vbktleURvd24gPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYgKCF0aGlzLl9pc09wZW4pIHJldHVybjtcclxuICAgIGlmIChlLndoaWNoID09PSBLRVlfQ09ERVMuTEVGVF9BUlJPVykge1xyXG4gICAgICAgIHRoaXMuYWR2YW5jZUxlZnQoKTtcclxuICAgIH0gZWxzZSBpZiAoZS53aGljaCA9PT0gS0VZX0NPREVTLlJJR0hUX0FSUk9XKSB7XHJcbiAgICAgICAgdGhpcy5hZHZhbmNlUmlnaHQoKTtcclxuICAgIH0gZWxzZSBpZiAoZS53aGljaCA9PT0gS0VZX0NPREVTLkVTQ0FQRSkge1xyXG4gICAgICAgIHRoaXMuY2xvc2UoKTsgICBcclxuICAgIH1cclxufTtcclxuXHJcblNsaWRlc2hvd01vZGFsLnByb3RvdHlwZS5fdXBkYXRlQ29udHJvbHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBSZS1lbmFibGVcclxuICAgIHRoaXMuXyRpbWFnZVJpZ2h0LnJlbW92ZUNsYXNzKFwiZGlzYWJsZWRcIik7XHJcbiAgICB0aGlzLl8kaW1hZ2VMZWZ0LnJlbW92ZUNsYXNzKFwiZGlzYWJsZWRcIik7XHJcbiAgICBcclxuICAgIC8vIERpc2FibGUgaWYgd2UndmUgcmVhY2hlZCB0aGUgdGhlIG1heCBvciBtaW4gbGltaXRcclxuICAgIGlmICh0aGlzLl9pbmRleCA+PSAodGhpcy5fc2xpZGVzaG93LmdldE51bUltYWdlcygpIC0gMSkpIHtcclxuICAgICAgICB0aGlzLl8kaW1hZ2VSaWdodC5hZGRDbGFzcyhcImRpc2FibGVkXCIpO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLl9pbmRleCA8PSAwKSB7XHJcbiAgICAgICAgdGhpcy5fJGltYWdlTGVmdC5hZGRDbGFzcyhcImRpc2FibGVkXCIpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuU2xpZGVzaG93TW9kYWwucHJvdG90eXBlLl9vblJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciAkaW1hZ2UgPSB0aGlzLl8kaW1hZ2VDb250YWluZXIuZmluZChcImltZ1wiKTtcclxuXHJcbiAgICAvLyBSZXNldCB0aGUgY29udGVudCdzIHdpZHRoXHJcbiAgICB0aGlzLl8kY29udGVudC53aWR0aChcIlwiKTtcclxuXHJcbiAgICAvLyBGaW5kIHRoZSBzaXplIG9mIHRoZSBjb21wb25lbnRzIHRoYXQgbmVlZCB0byBiZSBkaXNwbGF5ZWQgaW4gYWRkaXRpb24gdG8gXHJcbiAgICAvLyB0aGUgaW1hZ2VcclxuICAgIHZhciBjb250cm9sc1dpZHRoID0gdGhpcy5fJGltYWdlTGVmdC5vdXRlcldpZHRoKHRydWUpICsgXHJcbiAgICAgICAgdGhpcy5fJGltYWdlUmlnaHQub3V0ZXJXaWR0aCh0cnVlKTtcclxuICAgIC8vIEhhY2sgZm9yIG5vdyAtIGJ1ZGdldCBmb3IgMnggdGhlIGNhcHRpb24gaGVpZ2h0LiBcclxuICAgIHZhciBjYXB0aW9uSGVpZ2h0ID0gMyAqIHRoaXMuXyRjYXB0aW9uLm91dGVySGVpZ2h0KHRydWUpOyBcclxuICAgIHZhciBpbWFnZVBhZGRpbmcgPSAkaW1hZ2UuaW5uZXJXaWR0aCgpXHJcblxyXG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBhdmFpbGFibGUgYXJlYSBmb3IgdGhlIG1vZGFsXHJcbiAgICB2YXIgbXcgPSB0aGlzLl8kbW9kYWwud2lkdGgoKSAtIGNvbnRyb2xzV2lkdGg7XHJcbiAgICB2YXIgbWggPSB0aGlzLl8kbW9kYWwuaGVpZ2h0KCkgLSBjYXB0aW9uSGVpZ2h0O1xyXG5cclxuICAgIC8vIEZpdCB0aGUgaW1hZ2UgdG8gdGhlIHJlbWFpbmluZyBzY3JlZW4gcmVhbCBlc3RhdGUgXHJcbiAgICB2YXIgc2V0U2l6ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgaXcgPSAkaW1hZ2UucHJvcChcIm5hdHVyYWxXaWR0aFwiKTtcclxuICAgICAgICB2YXIgaWggPSAkaW1hZ2UucHJvcChcIm5hdHVyYWxIZWlnaHRcIik7XHJcbiAgICAgICAgdmFyIHN3ID0gaXcgLyBtdztcclxuICAgICAgICB2YXIgc2ggPSBpaCAvIG1oO1xyXG4gICAgICAgIHZhciBzID0gTWF0aC5tYXgoc3csIHNoKTtcclxuXHJcbiAgICAgICAgLy8gU2V0IHdpZHRoL2hlaWdodCB1c2luZyBDU1MgaW4gb3JkZXIgdG8gcmVzcGVjdCBib3gtc2l6aW5nXHJcbiAgICAgICAgaWYgKHMgPiAxKSB7XHJcbiAgICAgICAgICAgICRpbWFnZS5jc3MoXCJ3aWR0aFwiLCBpdyAvIHMgKyBcInB4XCIpO1xyXG4gICAgICAgICAgICAkaW1hZ2UuY3NzKFwiaGVpZ2h0XCIsIGloIC8gcyArIFwicHhcIik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJGltYWdlLmNzcyhcIndpZHRoXCIsIGl3ICsgXCJweFwiKTtcclxuICAgICAgICAgICAgJGltYWdlLmNzcyhcImhlaWdodFwiLCBpaCArIFwicHhcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl8kaW1hZ2VSaWdodC5jc3MoXCJ0b3BcIiwgJGltYWdlLm91dGVySGVpZ2h0KCkgLyAyICsgXCJweFwiKTtcclxuICAgICAgICB0aGlzLl8kaW1hZ2VMZWZ0LmNzcyhcInRvcFwiLCAkaW1hZ2Uub3V0ZXJIZWlnaHQoKSAvIDIgKyBcInB4XCIpO1xyXG5cclxuICAgICAgICAvLyBTZXQgdGhlIGNvbnRlbnQgd3JhcHBlciB0byBiZSB0aGUgd2lkdGggb2YgdGhlIGltYWdlLiBUaGlzIHdpbGwga2VlcCBcclxuICAgICAgICAvLyB0aGUgY2FwdGlvbiBmcm9tIGV4cGFuZGluZyBiZXlvbmQgdGhlIGltYWdlLlxyXG4gICAgICAgIHRoaXMuXyRjb250ZW50LndpZHRoKCRpbWFnZS5vdXRlcldpZHRoKHRydWUpKTsgICAgICAgIFxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICAgIGlmICgkaW1hZ2UucHJvcChcImNvbXBsZXRlXCIpKSBzZXRTaXplKCk7XHJcbiAgICBlbHNlICRpbWFnZS5vbmUoXCJsb2FkXCIsIHNldFNpemUpO1xyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFRodW1ibmFpbFNsaWRlc2hvd3M7XHJcblxyXG52YXIgdXRpbGl0aWVzID0gcmVxdWlyZShcIi4vdXRpbGl0aWVzLmpzXCIpO1xyXG52YXIgU2xpZGVzaG93TW9kYWwgPSByZXF1aXJlKFwiLi9zbGlkZXNob3ctbW9kYWwuanNcIik7XHJcblxyXG5mdW5jdGlvbiBUaHVtYm5haWxTbGlkZXNob3dzKHRyYW5zaXRpb25EdXJhdGlvbikgeyBcclxuICAgIHRyYW5zaXRpb25EdXJhdGlvbiA9ICh0cmFuc2l0aW9uRHVyYXRpb24gIT09IHVuZGVmaW5lZCkgP1xyXG4gICAgICAgIHRyYW5zaXRpb25EdXJhdGlvbiA6IDQwMDtcclxuICAgIHRoaXMuX2ltYWdlR2FsbGVyaWVzID0gW107XHJcbiAgICAkKFwiLnNsaWRlc2hvd1wiKS5lYWNoKGZ1bmN0aW9uIChpbmRleCwgZWxlbWVudCkge1xyXG4gICAgICAgIHZhciBnYWxsZXJ5ID0gbmV3IFRodW1ibmFpbFNsaWRlc2hvdygkKGVsZW1lbnQpLCB0cmFuc2l0aW9uRHVyYXRpb24pO1xyXG4gICAgICAgIHRoaXMuX2ltYWdlR2FsbGVyaWVzLnB1c2goZ2FsbGVyeSk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBUaHVtYm5haWxTbGlkZXNob3coJGNvbnRhaW5lciwgdHJhbnNpdGlvbkR1cmF0aW9uKSB7XHJcbiAgICB0aGlzLl90cmFuc2l0aW9uRHVyYXRpb24gPSB0cmFuc2l0aW9uRHVyYXRpb247XHJcbiAgICB0aGlzLl8kY29udGFpbmVyID0gJGNvbnRhaW5lcjtcclxuICAgIHRoaXMuX2luZGV4ID0gMDsgLy8gSW5kZXggb2Ygc2VsZWN0ZWQgaW1hZ2VcclxuXHJcbiAgICAvLyBDYWNoZSBhbmQgY3JlYXRlIG5lY2Vzc2FyeSBET00gZWxlbWVudHNcclxuICAgIHRoaXMuXyR0aHVtYm5haWxDb250YWluZXIgPSAkY29udGFpbmVyLmZpbmQoXCIudGh1bWJuYWlsc1wiKTtcclxuICAgIHRoaXMuXyR2aXNpYmxlVGh1bWJuYWlsV3JhcCA9ICRjb250YWluZXIuZmluZChcIi52aXNpYmxlLXRodW1ibmFpbHNcIik7XHJcbiAgICB0aGlzLl8kdGh1bWJuYWlsTGVmdENvbnRyb2wgPSAkY29udGFpbmVyLmZpbmQoXCIudGh1bWJuYWlsLWFkdmFuY2UtbGVmdFwiKTtcclxuICAgIHRoaXMuXyR0aHVtYm5haWxSaWdodENvbnRyb2wgPSAkY29udGFpbmVyLmZpbmQoXCIudGh1bWJuYWlsLWFkdmFuY2UtcmlnaHRcIik7ICAgIFxyXG4gICAgdGhpcy5fJGNhcHRpb25Db250YWluZXIgPSAkY29udGFpbmVyLmZpbmQoXCIuY2FwdGlvblwiKTtcclxuICAgIHRoaXMuXyRzZWxlY3RlZEltYWdlQ29udGFpbmVyID0gJGNvbnRhaW5lci5maW5kKFwiLnNlbGVjdGVkLWltYWdlXCIpO1xyXG5cclxuICAgIHRoaXMuXyRzZWxlY3RlZEltYWdlQ29udGFpbmVyLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICB2YXIgJG1vZGFsT3ZlcmxheSA9ICQoXCI8ZGl2PlwiLCB7Y2xhc3M6IFwic2xpZGVzaG93LW1vZGFsLW92ZXJsYXlcIn0pXHJcbiAgICAgICAgICAgIC5hcHBlbmRUbygkKGRvY3VtZW50LmJvZHkpKTtcclxuICAgICAgICB2YXIgJG1vZGFsID0gJChcIjxkaXY+XCIsIHtjbGFzczogXCJzbGlkZXNob3ctbW9kYWxcIn0pXHJcbiAgICAgICAgICAgIC5hcHBlbmRUbygkKGRvY3VtZW50LmJvZHkpKTtcclxuICAgICAgICB2YXIgJGN1cnJlbnRJbWFnZSA9IHRoaXMuXyRnYWxsZXJ5SW1hZ2VzW3RoaXMuX2luZGV4XTtcclxuICAgICAgICB2YXIgJGltYWdlID0gJChcIjxpbWc+XCIsIHtcclxuICAgICAgICAgICAgc3JjOiAkY3VycmVudEltYWdlLmF0dHIoXCJzcmNcIilcclxuICAgICAgICB9KS5hcHBlbmRUbygkbW9kYWwpO1xyXG5cclxuICAgICAgICB2YXIgbWF4SGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0ICogMC45NTtcclxuICAgICAgICBpZiAoJG1vZGFsLm91dGVySGVpZ2h0KGZhbHNlKSA+IG1heEhlaWdodCkge1xyXG4gICAgICAgICAgICAkbW9kYWwuY3NzKHtcclxuICAgICAgICAgICAgICAgIHdpZHRoOiBcImluaXRpYWxcIixcclxuICAgICAgICAgICAgICAgIGhlaWdodDogbWF4SGVpZ2h0ICsgXCJweFwiXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAkaW1hZ2UuY3NzKHtcclxuICAgICAgICAgICAgICAgIHdpZHRoOiBcImF1dG9cIixcclxuICAgICAgICAgICAgICAgIGhlaWdodDogXCIxMDAlXCJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkbW9kYWxPdmVybGF5Lm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgJG1vZGFsLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAkbW9kYWxPdmVybGF5LnJlbW92ZSgpO1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvLyBMb29wIHRocm91Z2ggdGhlIHRodW1ibmFpbHMsIGdpdmUgdGhlbSBhbiBpbmRleCBkYXRhIGF0dHJpYnV0ZSBhbmQgY2FjaGVcclxuICAgIC8vIGEgcmVmZXJlbmNlIHRvIHRoZW0gaW4gYW4gYXJyYXlcclxuICAgIHRoaXMuXyR0aHVtYm5haWxzID0gW107XHJcbiAgICB0aGlzLl8kdGh1bWJuYWlsQ29udGFpbmVyLmZpbmQoXCJpbWdcIikuZWFjaChmdW5jdGlvbiAoaW5kZXgsIGVsZW1lbnQpIHtcclxuICAgICAgICB2YXIgJHRodW1ibmFpbCA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgJHRodW1ibmFpbC5kYXRhKFwiaW5kZXhcIiwgaW5kZXgpO1xyXG4gICAgICAgIHRoaXMuXyR0aHVtYm5haWxzLnB1c2goJHRodW1ibmFpbCk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5fbnVtVGh1bWJuYWlscyA9IHRoaXMuXyR0aHVtYm5haWxzLmxlbmd0aDtcclxuXHJcbiAgICAvLyBDcmVhdGUgZW1wdHkgaW1hZ2VzIGluIHRoZSBnYWxsZXJ5IGZvciBlYWNoIHRodW1ibmFpbC4gVGhpcyBoZWxwcyB1cyBkb1xyXG4gICAgLy8gbGF6eSBsb2FkaW5nIG9mIGdhbGxlcnkgaW1hZ2VzIGFuZCBhbGxvd3MgdXMgdG8gY3Jvc3MtZmFkZSBpbWFnZXMuXHJcbiAgICB0aGlzLl8kZ2FsbGVyeUltYWdlcyA9IFtdO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl8kdGh1bWJuYWlscy5sZW5ndGg7IGkgKz0gMSkge1xyXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgaWQgZnJvbSB0aGUgcGF0aCB0byB0aGUgbGFyZ2UgaW1hZ2VcclxuICAgICAgICB2YXIgbGFyZ2VQYXRoID0gdGhpcy5fJHRodW1ibmFpbHNbaV0uZGF0YShcImxhcmdlLXBhdGhcIik7XHJcbiAgICAgICAgdmFyIGlkID0gbGFyZ2VQYXRoLnNwbGl0KFwiL1wiKS5wb3AoKS5zcGxpdChcIi5cIilbMF07XHJcbiAgICAgICAgdmFyICRnYWxsZXJ5SW1hZ2UgPSAkKFwiPGltZz5cIiwge2lkOiBpZH0pXHJcbiAgICAgICAgICAgIC5jc3Moe1xyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IFwiYWJzb2x1dGVcIixcclxuICAgICAgICAgICAgICAgIHRvcDogXCIwcHhcIixcclxuICAgICAgICAgICAgICAgIGxlZnQ6IFwiMHB4XCIsXHJcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLFxyXG4gICAgICAgICAgICAgICAgekluZGV4OiAwXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5kYXRhKFwiaW1hZ2UtdXJsXCIsIGxhcmdlUGF0aClcclxuICAgICAgICAgICAgLmFwcGVuZFRvKHRoaXMuXyRzZWxlY3RlZEltYWdlQ29udGFpbmVyKTtcclxuICAgICAgICAkZ2FsbGVyeUltYWdlLmdldCgwKS5zcmMgPSBsYXJnZVBhdGg7IC8vIFRPRE86IE1ha2UgdGhpcyBsYXp5IVxyXG4gICAgICAgIHRoaXMuXyRnYWxsZXJ5SW1hZ2VzLnB1c2goJGdhbGxlcnlJbWFnZSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fJHRodW1ibmFpbFJpZ2h0Q29udHJvbC5vbihcImNsaWNrXCIsIFxyXG4gICAgICAgIHRoaXMuX29uUmlnaHRDb250cm9sQ2xpY2suYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLl8kdGh1bWJuYWlsTGVmdENvbnRyb2wub24oXCJjbGlja1wiLCBcclxuICAgICAgICB0aGlzLl9vbkxlZnRDb250cm9sQ2xpY2suYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLy8gRm9yIHNvbWUgcmVhc29uLCB0aGUgc2l6aW5nIG9uIHRoZSBjb250cm9scyBpcyBtZXNzZWQgdXAgaWYgaXQgcnVuc1xyXG4gICAgLy8gaW1tZWRpYXRlbHkgLSBkZWxheSBzaXppbmcgdW50aWwgc3RhY2sgaXMgY2xlYXJcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuX29uUmVzaXplKCk7XHJcbiAgICAgICAgJCh3aW5kb3cpLm9uKFwicmVzaXplXCIsIHRoaXMuX29uUmVzaXplLmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGVUaHVtYm5haWxDb250cm9scygpO1xyXG5cclxuICAgICAgICAvLyBBY3RpdmF0ZSB0aGUgZmlyc3QgdGh1bWJuYWlsIGFuZCBkaXNwbGF5IGl0IGluIHRoZSBnYWxsZXJ5IFxyXG4gICAgICAgIHRoaXMuX3N3aXRjaEFjdGl2ZUltYWdlKDApO1xyXG5cclxuICAgICAgICAvLyBCaW5kIHRoZSBldmVudCBoYW5kbGVycyB0byB0aGUgaW1hZ2VzXHJcbiAgICAgICAgdGhpcy5fJHRodW1ibmFpbENvbnRhaW5lci5maW5kKFwiaW1nXCIpLm9uKFwiY2xpY2tcIiwgdGhpcy5fb25DbGljay5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgdGhpcy5fbW9kYWwgPSBuZXcgU2xpZGVzaG93TW9kYWwoJGNvbnRhaW5lciwgdGhpcyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5fJHNlbGVjdGVkSW1hZ2VDb250YWluZXIub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX21vZGFsLm9wZW4odGhpcy5faW5kZXgpOyAgICBcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgfS5iaW5kKHRoaXMpLCAwKTtcclxufVxyXG5cclxuVGh1bWJuYWlsU2xpZGVzaG93LnByb3RvdHlwZS5nZXRBY3RpdmVJbmRleCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLl9pbmRleDtcclxufTtcclxuXHJcblRodW1ibmFpbFNsaWRlc2hvdy5wcm90b3R5cGUuZ2V0TnVtSW1hZ2VzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX251bVRodW1ibmFpbHM7XHJcbn07XHJcblxyXG5UaHVtYm5haWxTbGlkZXNob3cucHJvdG90eXBlLmdldEdhbGxlcnlJbWFnZSA9IGZ1bmN0aW9uIChpbmRleCkge1xyXG4gICAgcmV0dXJuIHRoaXMuXyRnYWxsZXJ5SW1hZ2VzW2luZGV4XTtcclxufTtcclxuXHJcblRodW1ibmFpbFNsaWRlc2hvdy5wcm90b3R5cGUuZ2V0Q2FwdGlvbiA9IGZ1bmN0aW9uIChpbmRleCkge1xyXG4gICAgcmV0dXJuIHRoaXMuXyR0aHVtYm5haWxzW2luZGV4XS5kYXRhKFwiY2FwdGlvblwiKTtcclxufTtcclxuXHJcblRodW1ibmFpbFNsaWRlc2hvdy5wcm90b3R5cGUuX29uTGVmdENvbnRyb2xDbGljayA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuX3Njcm9sbFRvVGh1bWJuYWlsKHRoaXMuX3Njcm9sbEluZGV4IC0gdGhpcy5fbnVtVmlzaWJsZSk7XHJcbn07XHJcblxyXG5UaHVtYm5haWxTbGlkZXNob3cucHJvdG90eXBlLl9vblJpZ2h0Q29udHJvbENsaWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5fc2Nyb2xsVG9UaHVtYm5haWwodGhpcy5fc2Nyb2xsSW5kZXggKyB0aGlzLl9udW1WaXNpYmxlKTtcclxufTtcclxuXHJcblRodW1ibmFpbFNsaWRlc2hvdy5wcm90b3R5cGUuX3Jlc2V0U2l6aW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gUmVzZXQgc2l6aW5nIHZhcmlhYmxlcy4gVGhpcyBpbmNsdWRlcyByZXNldHRpbmcgYW55IGlubGluZSBzdHlsZSB0aGF0IGhhc1xyXG4gICAgLy8gYmVlbiBhcHBsaWVkLCBzbyB0aGF0IGFueSBzaXplIGNhbGN1bGF0aW9ucyBjYW4gYmUgYmFzZWQgb24gdGhlIENTU1xyXG4gICAgLy8gc3R5bGluZy5cclxuICAgIHRoaXMuXyR0aHVtYm5haWxDb250YWluZXIuY3NzKHtcclxuICAgICAgICB0b3A6IFwiXCIsIGxlZnQ6IFwiXCIsIHdpZHRoOiBcIlwiLCBoZWlnaHQ6IFwiXCJcclxuICAgIH0pXHJcbiAgICB0aGlzLl8kdmlzaWJsZVRodW1ibmFpbFdyYXAud2lkdGgoXCJcIik7XHJcbiAgICB0aGlzLl8kdmlzaWJsZVRodW1ibmFpbFdyYXAuaGVpZ2h0KFwiXCIpO1xyXG4gICAgLy8gTWFrZSBhbGwgdGh1bWJuYWlscyBzcXVhcmUgYW5kIHJlc2V0IGFueSBoZWlnaHRcclxuICAgIHRoaXMuXyR0aHVtYm5haWxzLmZvckVhY2goZnVuY3Rpb24gKCRlbGVtZW50KSB7IFxyXG4gICAgICAgICRlbGVtZW50LmhlaWdodChcIlwiKTsgLy8gUmVzZXQgaGVpZ2h0IGJlZm9yZSBzZXR0aW5nIHdpZHRoXHJcbiAgICAgICAgJGVsZW1lbnQud2lkdGgoJGVsZW1lbnQuaGVpZ2h0KCkpO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG5UaHVtYm5haWxTbGlkZXNob3cucHJvdG90eXBlLl9vblJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuX3Jlc2V0U2l6aW5nKCk7XHJcblxyXG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBzaXplIG9mIHRoZSBmaXJzdCB0aHVtYm5haWwuIFRoaXMgYXNzdW1lcyB0aGUgZmlyc3QgaW1hZ2VcclxuICAgIC8vIG9ubHkgaGFzIGEgcmlnaHQtc2lkZSBtYXJnaW4uXHJcbiAgICB2YXIgJGZpcnN0VGh1bWIgPSB0aGlzLl8kdGh1bWJuYWlsc1swXTtcclxuICAgIHZhciB0aHVtYlNpemUgPSAkZmlyc3RUaHVtYi5vdXRlckhlaWdodChmYWxzZSk7XHJcbiAgICB2YXIgdGh1bWJNYXJnaW4gPSAyICogKCRmaXJzdFRodW1iLm91dGVyV2lkdGgodHJ1ZSkgLSB0aHVtYlNpemUpO1xyXG5cclxuICAgIC8vIE1lYXN1cmUgY29udHJvbHMuIFRoZXkgbmVlZCB0byBiZSB2aXNpYmxlIGluIG9yZGVyIHRvIGJlIG1lYXN1cmVkLlxyXG4gICAgdGhpcy5fJHRodW1ibmFpbExlZnRDb250cm9sLmNzcyhcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcclxuICAgIHRoaXMuXyR0aHVtYm5haWxSaWdodENvbnRyb2wuY3NzKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xyXG4gICAgdmFyIHRodW1iQ29udHJvbFdpZHRoID0gdGhpcy5fJHRodW1ibmFpbExlZnRDb250cm9sLm91dGVyV2lkdGgodHJ1ZSkgK1xyXG4gICAgICAgIHRoaXMuXyR0aHVtYm5haWxSaWdodENvbnRyb2wub3V0ZXJXaWR0aCh0cnVlKTtcclxuXHJcbiAgICAvLyBDYWxjdWxhdGUgaG93IG1hbnkgdGh1bWJuYWlscyBjYW4gZml0IHdpdGhpbiB0aGUgdGh1bWJuYWlsIGFyZWFcclxuICAgIHZhciB2aXNpYmxlV2lkdGggPSB0aGlzLl8kdmlzaWJsZVRodW1ibmFpbFdyYXAub3V0ZXJXaWR0aChmYWxzZSk7XHJcbiAgICB2YXIgbnVtVGh1bWJzVmlzaWJsZSA9ICh2aXNpYmxlV2lkdGggLSB0aHVtYk1hcmdpbikgLyBcclxuICAgICAgICAodGh1bWJTaXplICsgdGh1bWJNYXJnaW4pO1xyXG5cclxuICAgIC8vIENoZWNrIHdoZXRoZXIgYWxsIHRoZSB0aHVtYm5haWxzIGNhbiBmaXQgb24gdGhlIHNjcmVlbiBhdCBvbmNlXHJcbiAgICBpZiAobnVtVGh1bWJzVmlzaWJsZSA8IHRoaXMuX251bVRodW1ibmFpbHMpIHtcclxuICAgICAgICB0aGlzLl9hbGxUaHVtYm5haWxzVmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIC8vIFRha2UgYSBiZXN0IGd1ZXNzIGF0IGhvdyB0byBzaXplIHRoZSB0aHVtYm5haWxzLiBTaXplIGZvcm11bGE6XHJcbiAgICAgICAgLy8gIHdpZHRoID0gbnVtICogdGh1bWJTaXplICsgKG51bSAtIDEpICogdGh1bWJNYXJnaW4gKyBjb250cm9sU2l6ZVxyXG4gICAgICAgIC8vIFNvbHZlIGZvciBudW1iZXIgb2YgdGh1bWJuYWlscyBhbmQgcm91bmQgdG8gdGhlIG5lYXJlc3QgaW50ZWdlciBzbyBcclxuICAgICAgICAvLyB0aGF0IHdlIGRvbid0IGhhdmUgYW55IHBhcnRpYWwgdGh1bWJuYWlscyBzaG93aW5nLlxyXG4gICAgICAgIG51bVRodW1ic1Zpc2libGUgPSBNYXRoLnJvdW5kKFxyXG4gICAgICAgICAgICAodmlzaWJsZVdpZHRoIC0gdGh1bWJDb250cm9sV2lkdGggKyB0aHVtYk1hcmdpbikgLyBcclxuICAgICAgICAgICAgKHRodW1iU2l6ZSArIHRodW1iTWFyZ2luKVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgdGhpcy5fbnVtVmlzaWJsZSA9IG51bVRodW1ic1Zpc2libGU7XHJcblxyXG4gICAgICAgIC8vIFVzZSB0aGlzIG51bWJlciBvZiB0aHVtYm5haWxzIHRvIGNhbGN1bGF0ZSB0aGUgdGh1bWJuYWlsIHNpemVcclxuICAgICAgICB2YXIgbmV3U2l6ZSA9ICh2aXNpYmxlV2lkdGggLSB0aHVtYkNvbnRyb2xXaWR0aCArIHRodW1iTWFyZ2luKSAvIFxyXG4gICAgICAgICAgICBudW1UaHVtYnNWaXNpYmxlIC0gdGh1bWJNYXJnaW47XHJcbiAgICAgICAgdGhpcy5fJHRodW1ibmFpbHMuZm9yRWFjaChmdW5jdGlvbiAoJGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgLy8gJC53aWR0aCBhbmQgJC5oZWlnaHQgc2V0IHRoZSBjb250ZW50IHNpemUgcmVnYXJkbGVzcyBvZiB0aGUgXHJcbiAgICAgICAgICAgIC8vIGJveC1zaXppbmcuIFRoZSBpbWFnZXMgYXJlIGJvcmRlci1ib3gsIHNvIHdlIHdhbnQgdGhlIENTUyB3aWR0aFxyXG4gICAgICAgICAgICAvLyBhbmQgaGVpZ2h0LiBUaGlzIGFsbG93cyB0aGUgYWN0aXZlIGltYWdlIHRvIGhhdmUgYSBib3JkZXIgYW5kIHRoZVxyXG4gICAgICAgICAgICAvLyBvdGhlciBpbWFnZXMgdG8gaGF2ZSBwYWRkaW5nLiBcclxuICAgICAgICAgICAgJGVsZW1lbnQuY3NzKFwid2lkdGhcIiwgbmV3U2l6ZSArIFwicHhcIik7XHJcbiAgICAgICAgICAgICRlbGVtZW50LmNzcyhcImhlaWdodFwiLCBuZXdTaXplICsgXCJweFwiKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gU2V0IHRoZSB0aHVtYm5haWwgd3JhcCBzaXplLiBJdCBzaG91bGQgYmUganVzdCB0YWxsIGVub3VnaCB0byBmaXQgYVxyXG4gICAgICAgIC8vIHRodW1ibmFpbCBhbmQgbG9uZyBlbm91Z2ggdG8gaG9sZCBhbGwgdGhlIHRodW1ibmFpbHMgaW4gb25lIGxpbmU6XHJcbiAgICAgICAgdmFyIHRvdGFsU2l6ZSA9IG5ld1NpemUgKiB0aGlzLl9udW1UaHVtYm5haWxzICsgXHJcbiAgICAgICAgICAgIHRodW1iTWFyZ2luICogKHRoaXMuX251bVRodW1ibmFpbHMgLSAxKTtcclxuICAgICAgICB0aGlzLl8kdGh1bWJuYWlsQ29udGFpbmVyLmNzcyh7XHJcbiAgICAgICAgICAgIHdpZHRoOiB0b3RhbFNpemUgKyBcInB4XCIsXHJcbiAgICAgICAgICAgIGhlaWdodDogJGZpcnN0VGh1bWIub3V0ZXJIZWlnaHQodHJ1ZSkgKyBcInB4XCJcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gU2V0IHRoZSB2aXNpYmxlIHRodW1ibmFpbCB3cmFwIHNpemUuIFRoaXMgaXMgdXNlZCB0byBtYWtzIHRoZSBtdWNoIFxyXG4gICAgICAgIC8vIGxhcmdlciB0aHVtYm5haWwgY29udGFpbmVyLiBJdCBzaG91bGQgYmUgYXMgd2lkZSBhcyBpdCBjYW4gYmUsIG1pbnVzXHJcbiAgICAgICAgLy8gdGhlIHNwYWNlIG5lZWRlZCBmb3IgdGhlIGxlZnQvcmlnaHQgY29udG9scy5cclxuICAgICAgICB0aGlzLl8kdmlzaWJsZVRodW1ibmFpbFdyYXAuY3NzKHtcclxuICAgICAgICAgICAgd2lkdGg6IHZpc2libGVXaWR0aCAtIHRodW1iQ29udHJvbFdpZHRoICsgXCJweFwiLFxyXG4gICAgICAgICAgICBoZWlnaHQ6ICRmaXJzdFRodW1iLm91dGVySGVpZ2h0KHRydWUpICsgXCJweFwiXHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEFsbCB0aHVtYm5haWxzIGFyZSB2aXNpYmxlLCB3ZSBjYW4gaGlkZSB0aGUgY29udHJvbHMgYW5kIGV4cGFuZCB0aGVcclxuICAgICAgICAvLyB0aHVtYm5haWwgY29udGFpbmVyIHRvIDEwMCVcclxuICAgICAgICB0aGlzLl9hbGxUaHVtYm5haWxzVmlzaWJsZSA9IHRydWU7ICAgICAgICBcclxuICAgICAgICB0aGlzLl9udW1WaXNpYmxlID0gdGhpcy5fbnVtVGh1bWJuYWlscztcclxuICAgICAgICB0aGlzLl8kdGh1bWJuYWlsQ29udGFpbmVyLmNzcyhcIndpZHRoXCIsIFwiMTAwJVwiKTtcclxuICAgICAgICB0aGlzLl8kdGh1bWJuYWlsTGVmdENvbnRyb2wuY3NzKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XHJcbiAgICAgICAgdGhpcy5fJHRodW1ibmFpbFJpZ2h0Q29udHJvbC5jc3MoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDYWxjdWxhdGUgdGhlIGJvdW5kcyBvZiB0aGUgc2Nyb2xsaW5nXHJcbiAgICB0aGlzLl9tYXhTY3JvbGwgPSAwO1xyXG4gICAgdGhpcy5fbWluU2Nyb2xsID0gdGhpcy5fJHZpc2libGVUaHVtYm5haWxXcmFwLndpZHRoKCkgLSBcclxuICAgICAgICB0aGlzLl8kdGh1bWJuYWlsQ29udGFpbmVyLndpZHRoKCk7XHJcbiAgICB0aGlzLl9zY3JvbGxJbmRleCA9IDA7XHJcbiAgICB0aGlzLl9taWRTY3JvbGxJbmRleCA9IE1hdGguZmxvb3IoKHRoaXMuX251bVZpc2libGUgLSAxKSAvIDIpO1xyXG4gICAgdGhpcy5fbWluU2Nyb2xsSW5kZXggPSB0aGlzLl9taWRTY3JvbGxJbmRleDtcclxuICAgIHRoaXMuX21heFNjcm9sbEluZGV4ID0gdGhpcy5fbnVtVGh1bWJuYWlscyAtIDEgLSB0aGlzLl9taWRTY3JvbGxJbmRleDtcclxuICAgIHRoaXMuX3VwZGF0ZVRodW1ibmFpbENvbnRyb2xzKCk7XHJcbn07XHJcblxyXG5UaHVtYm5haWxTbGlkZXNob3cucHJvdG90eXBlLl9zd2l0Y2hBY3RpdmVJbWFnZSA9IGZ1bmN0aW9uIChpbmRleCkge1xyXG4gICAgLy8gUmVzZXQgYWxsIGltYWdlcyB0byBpbnZpc2libGUgYW5kIGxvd2VzdCB6LWluZGV4LiBUaGlzIGNvdWxkIGJlIHNtYXJ0ZXIsXHJcbiAgICAvLyBsaWtlIEhvdmVyU2xpZGVzaG93LCBhbmQgb25seSByZXNldCBleGFjdGx5IHdoYXQgd2UgbmVlZCwgYnV0IHdlIGFyZW4ndCBcclxuICAgIC8vIHdhc3RpbmcgdGhhdCBtYW55IGN5Y2xlcy5cclxuICAgIHRoaXMuXyRnYWxsZXJ5SW1hZ2VzLmZvckVhY2goZnVuY3Rpb24gKCRnYWxsZXJ5SW1hZ2UpIHtcclxuICAgICAgICAkZ2FsbGVyeUltYWdlLmNzcyh7XHJcbiAgICAgICAgICAgIFwiekluZGV4XCI6IDAsXHJcbiAgICAgICAgICAgIFwib3BhY2l0eVwiOiAwXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJGdhbGxlcnlJbWFnZS52ZWxvY2l0eShcInN0b3BcIik7IC8vIFN0b3AgYW55IGFuaW1hdGlvbnNcclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIC8vIENhY2hlIHJlZmVyZW5jZXMgdG8gdGhlIGxhc3QgYW5kIGN1cnJlbnQgaW1hZ2UgJiB0aHVtYm5haWxzXHJcbiAgICB2YXIgJGxhc3RUaHVtYm5haWwgPSB0aGlzLl8kdGh1bWJuYWlsc1t0aGlzLl9pbmRleF07XHJcbiAgICB2YXIgJGxhc3RJbWFnZSA9IHRoaXMuXyRnYWxsZXJ5SW1hZ2VzW3RoaXMuX2luZGV4XTtcclxuICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XHJcbiAgICB2YXIgJGN1cnJlbnRUaHVtYm5haWwgPSB0aGlzLl8kdGh1bWJuYWlsc1t0aGlzLl9pbmRleF07XHJcbiAgICB2YXIgJGN1cnJlbnRJbWFnZSA9IHRoaXMuXyRnYWxsZXJ5SW1hZ2VzW3RoaXMuX2luZGV4XTtcclxuXHJcbiAgICAvLyBBY3RpdmF0ZS9kZWFjdGl2YXRlIHRodW1ibmFpbHNcclxuICAgICRsYXN0VGh1bWJuYWlsLnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xyXG4gICAgJGN1cnJlbnRUaHVtYm5haWwuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XHJcblxyXG4gICAgdGhpcy5fc2Nyb2xsVG9UaHVtYm5haWwodGhpcy5faW5kZXgpO1xyXG5cclxuICAgIC8vIE1ha2UgdGhlIGxhc3QgaW1hZ2UgdmlzaXNibGUgYW5kIHRoZW4gYW5pbWF0ZSB0aGUgY3VycmVudCBpbWFnZSBpbnRvIHZpZXdcclxuICAgIC8vIG9uIHRvcCBvZiB0aGUgbGFzdFxyXG4gICAgJGxhc3RJbWFnZS5jc3MoXCJ6SW5kZXhcIiwgMSk7XHJcbiAgICAkY3VycmVudEltYWdlLmNzcyhcInpJbmRleFwiLCAyKTtcclxuICAgICRsYXN0SW1hZ2UuY3NzKFwib3BhY2l0eVwiLCAxKTtcclxuICAgICRjdXJyZW50SW1hZ2UudmVsb2NpdHkoe1wib3BhY2l0eVwiOiAxfSwgdGhpcy5fdHJhbnNpdGlvbkR1cmF0aW9uLCBcclxuICAgICAgICBcImVhc2VJbk91dFF1YWRcIik7XHJcblxyXG4gICAgLy8gQ3JlYXRlIHRoZSBjYXB0aW9uLCBpZiBpdCBleGlzdHMgb24gdGhlIHRodW1ibmFpbFxyXG4gICAgdmFyIGNhcHRpb24gPSAkY3VycmVudFRodW1ibmFpbC5kYXRhKFwiY2FwdGlvblwiKTtcclxuICAgIGlmIChjYXB0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5fJGNhcHRpb25Db250YWluZXIuZW1wdHkoKTtcclxuICAgICAgICAkKFwiPHNwYW4+XCIpLmFkZENsYXNzKFwiZmlndXJlLW51bWJlclwiKVxyXG4gICAgICAgICAgICAudGV4dChcIkZpZy4gXCIgKyAodGhpcy5faW5kZXggKyAxKSArIFwiOiBcIilcclxuICAgICAgICAgICAgLmFwcGVuZFRvKHRoaXMuXyRjYXB0aW9uQ29udGFpbmVyKTtcclxuICAgICAgICAkKFwiPHNwYW4+XCIpLmFkZENsYXNzKFwiY2FwdGlvbi10ZXh0XCIpXHJcbiAgICAgICAgICAgIC50ZXh0KGNhcHRpb24pXHJcbiAgICAgICAgICAgIC5hcHBlbmRUbyh0aGlzLl8kY2FwdGlvbkNvbnRhaW5lcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT2JqZWN0IGltYWdlIGZpdCBwb2x5ZmlsbCBicmVha3MgalF1ZXJ5IGF0dHIoLi4uKSwgc28gZmFsbGJhY2sgdG8ganVzdCBcclxuICAgIC8vIHVzaW5nIGVsZW1lbnQuc3JjXHJcbiAgICAvLyBUT0RPOiBMYXp5IVxyXG4gICAgLy8gaWYgKCRjdXJyZW50SW1hZ2UuZ2V0KDApLnNyYyA9PT0gXCJcIikge1xyXG4gICAgLy8gICAgICRjdXJyZW50SW1hZ2UuZ2V0KDApLnNyYyA9ICRjdXJyZW50SW1hZ2UuZGF0YShcImltYWdlLXVybFwiKTtcclxuICAgIC8vIH1cclxufTtcclxuXHJcblRodW1ibmFpbFNsaWRlc2hvdy5wcm90b3R5cGUuX3Njcm9sbFRvVGh1bWJuYWlsID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAvLyBGaWd1cmUgb3V0IHdoYXQgd2UgY2FuIGFjdHVhbGx5IHNjcm9sbCB0byAtIHdlIGRvbid0IHdhbnQgdG8gc2Nyb2xsIG91dFxyXG4gICAgLy8gb2YgYm91bmRzXHJcbiAgICBpbmRleCA9IE1hdGgubWF4KGluZGV4LCB0aGlzLl9taW5TY3JvbGxJbmRleCk7XHJcbiAgICBpbmRleCA9IE1hdGgubWluKGluZGV4LCB0aGlzLl9tYXhTY3JvbGxJbmRleCk7XHJcbiAgICB0aGlzLl9zY3JvbGxJbmRleCA9IGluZGV4O1xyXG5cclxuICAgIHRoaXMuX3VwZGF0ZVRodW1ibmFpbENvbnRyb2xzKCk7XHJcblxyXG4gICAgLy8gdGhpcy5fbnVtVmlzaWJsZSBjYW4gYmUgdXNlZCB0byBmaWd1cmUgb3V0IHdoaWNoIHRvIGNlbnRlclxyXG4gICAgdmFyIHRodW1iU2l6ZSA9IHBhcnNlRmxvYXQodGhpcy5fJHRodW1ibmFpbHNbMF0uY3NzKFwid2lkdGhcIikpO1xyXG4gICAgdmFyIHRodW1iTWFyZ2luID0gMiAqIHBhcnNlRmxvYXQodGhpcy5fJHRodW1ibmFpbHNbMF0uY3NzKFwibWFyZ2luLXJpZ2h0XCIpKTsgXHJcbiAgICB2YXIgY2VudGVyWCA9IHRodW1iU2l6ZSAqIHRoaXMuX21pZFNjcm9sbEluZGV4ICsgXHJcbiAgICAgICAgdGh1bWJNYXJnaW4gKiAodGhpcy5fbWlkU2Nyb2xsSW5kZXggLSAxKTtcclxuICAgIHZhciB0aHVtYlggPSB0aHVtYlNpemUgKiBpbmRleCArIHRodW1iTWFyZ2luICogKGluZGV4IC0gMSk7XHJcblxyXG4gICAgdmFyIGxlZnQgPSBjZW50ZXJYIC0gdGh1bWJYO1xyXG4gICAgbGVmdCA9IE1hdGgubWluKGxlZnQsIHRoaXMuX21heFNjcm9sbCk7XHJcbiAgICBsZWZ0ID0gTWF0aC5tYXgobGVmdCwgdGhpcy5fbWluU2Nyb2xsKTtcclxuXHJcbiAgICB0aGlzLl8kdGh1bWJuYWlsQ29udGFpbmVyLnZlbG9jaXR5KFwic3RvcFwiKTtcclxuICAgIHRoaXMuXyR0aHVtYm5haWxDb250YWluZXIudmVsb2NpdHkoe1xyXG4gICAgICAgIFwibGVmdFwiOiBsZWZ0ICsgXCJweFwiXHJcbiAgICB9LCA2MDAsIFwiZWFzZUluT3V0UXVhZFwiKTtcclxufTtcclxuXHJcblRodW1ibmFpbFNsaWRlc2hvdy5wcm90b3R5cGUuX29uQ2xpY2sgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgdmFyICR0YXJnZXQgPSAkKGUudGFyZ2V0KTtcclxuICAgIHZhciBpbmRleCA9ICR0YXJnZXQuZGF0YShcImluZGV4XCIpO1xyXG4gICAgXHJcbiAgICAvLyBDbGlja2VkIG9uIHRoZSBhY3RpdmUgaW1hZ2UgLSBubyBuZWVkIHRvIGRvIGFueXRoaW5nXHJcbiAgICBpZiAodGhpcy5faW5kZXggPT09IGluZGV4KSByZXR1cm47XHJcblxyXG4gICAgdGhpcy5fc3dpdGNoQWN0aXZlSW1hZ2UoaW5kZXgpOyAgXHJcbn07XHJcblxyXG5UaHVtYm5haWxTbGlkZXNob3cucHJvdG90eXBlLl91cGRhdGVUaHVtYm5haWxDb250cm9scyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIFJlLWVuYWJsZVxyXG4gICAgdGhpcy5fJHRodW1ibmFpbFJpZ2h0Q29udHJvbC5yZW1vdmVDbGFzcyhcImRpc2FibGVkXCIpO1xyXG4gICAgdGhpcy5fJHRodW1ibmFpbExlZnRDb250cm9sLnJlbW92ZUNsYXNzKFwiZGlzYWJsZWRcIik7XHJcbiAgICBcclxuICAgIC8vIERpc2FibGUgaWYgd2UndmUgcmVhY2hlZCB0aGUgdGhlIG1heCBvciBtaW4gbGltaXRcclxuICAgIGlmICh0aGlzLl9zY3JvbGxJbmRleCA+PSB0aGlzLl9tYXhTY3JvbGxJbmRleCkge1xyXG4gICAgICAgIHRoaXMuXyR0aHVtYm5haWxSaWdodENvbnRyb2wuYWRkQ2xhc3MoXCJkaXNhYmxlZFwiKTtcclxuICAgIH0gZWxzZSBpZiAodGhpcy5fc2Nyb2xsSW5kZXggPD0gdGhpcy5fbWluU2Nyb2xsSW5kZXgpIHtcclxuICAgICAgICB0aGlzLl8kdGh1bWJuYWlsTGVmdENvbnRyb2wuYWRkQ2xhc3MoXCJkaXNhYmxlZFwiKTtcclxuICAgIH1cclxufTsiLCJleHBvcnRzLmRlZmF1bHQgPSBmdW5jdGlvbiAodmFsLCBkZWZhdWx0VmFsKSB7XHJcbiAgICByZXR1cm4gKHZhbCAhPT0gdW5kZWZpbmVkKSA/IHZhbCA6IGRlZmF1bHRWYWw7XHJcbn07XHJcblxyXG4vLyBVbnRlc3RlZFxyXG4vLyBleHBvcnRzLmRlZmF1bHRQcm9wZXJ0aWVzID0gZnVuY3Rpb24gZGVmYXVsdFByb3BlcnRpZXMgKG9iaiwgcHJvcHMpIHtcclxuLy8gICAgIGZvciAodmFyIHByb3AgaW4gcHJvcHMpIHtcclxuLy8gICAgICAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkocHJvcHMsIHByb3ApKSB7XHJcbi8vICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGV4cG9ydHMuZGVmYXVsdFZhbHVlKHByb3BzLnZhbHVlLCBwcm9wcy5kZWZhdWx0KTtcclxuLy8gICAgICAgICAgICAgb2JqW3Byb3BdID0gdmFsdWU7XHJcbi8vICAgICAgICAgfVxyXG4vLyAgICAgfVxyXG4vLyAgICAgcmV0dXJuIG9iajtcclxuLy8gfTtcclxuLy8gXHJcbmV4cG9ydHMudGltZUl0ID0gZnVuY3Rpb24gKGZ1bmMpIHtcclxuICAgIHZhciBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgZnVuYygpO1xyXG4gICAgdmFyIGVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgcmV0dXJuIGVuZCAtIHN0YXJ0O1xyXG59O1xyXG5cclxuZXhwb3J0cy5pc0luUmVjdCA9IGZ1bmN0aW9uICh4LCB5LCByZWN0KSB7XHJcbiAgICBpZiAoeCA+PSByZWN0LnggJiYgeCA8PSAocmVjdC54ICsgcmVjdC53KSAmJlxyXG4gICAgICAgIHkgPj0gcmVjdC55ICYmIHkgPD0gKHJlY3QueSArIHJlY3QuaCkpIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbmV4cG9ydHMucmFuZEludCA9IGZ1bmN0aW9uIChtaW4sIG1heCkge1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XHJcbn07XHJcblxyXG5leHBvcnRzLnJhbmRBcnJheUVsZW1lbnQgPSBmdW5jdGlvbiAoYXJyYXkpIHtcclxuICAgIHZhciBpID0gZXhwb3J0cy5yYW5kSW50KDAsIGFycmF5Lmxlbmd0aCAtIDEpOyAgICBcclxuICAgIHJldHVybiBhcnJheVtpXTtcclxufTtcclxuXHJcbmV4cG9ydHMubWFwID0gZnVuY3Rpb24gKG51bSwgbWluMSwgbWF4MSwgbWluMiwgbWF4Miwgb3B0aW9ucykge1xyXG4gICAgdmFyIG1hcHBlZCA9IChudW0gLSBtaW4xKSAvIChtYXgxIC0gbWluMSkgKiAobWF4MiAtIG1pbjIpICsgbWluMjtcclxuICAgIGlmICghb3B0aW9ucykgcmV0dXJuIG1hcHBlZDtcclxuICAgIGlmIChvcHRpb25zLnJvdW5kICYmIG9wdGlvbnMucm91bmQgPT09IHRydWUpIHtcclxuICAgICAgICBtYXBwZWQgPSBNYXRoLnJvdW5kKG1hcHBlZCk7XHJcbiAgICB9XHJcbiAgICBpZiAob3B0aW9ucy5mbG9vciAmJiBvcHRpb25zLmZsb29yID09PSB0cnVlKSB7XHJcbiAgICAgICAgbWFwcGVkID0gTWF0aC5mbG9vcihtYXBwZWQpOyAgICAgICAgXHJcbiAgICB9XHJcbiAgICBpZiAob3B0aW9ucy5jZWlsICYmIG9wdGlvbnMuY2VpbCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIG1hcHBlZCA9IE1hdGguY2VpbChtYXBwZWQpOyAgICAgICAgXHJcbiAgICB9XHJcbiAgICBpZiAob3B0aW9ucy5jbGFtcCAmJiBvcHRpb25zLmNsYW1wID09PSB0cnVlKSB7XHJcbiAgICAgICAgbWFwcGVkID0gTWF0aC5taW4obWFwcGVkLCBtYXgyKTtcclxuICAgICAgICBtYXBwZWQgPSBNYXRoLm1heChtYXBwZWQsIG1pbjIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG1hcHBlZDtcclxufTtcclxuXHJcbmV4cG9ydHMuZ2V0UXVlcnlQYXJhbWV0ZXJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gQ2hlY2sgZm9yIHF1ZXJ5IHN0cmluZ1xyXG4gICAgcXMgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xyXG4gICAgaWYgKHFzLmxlbmd0aCA8PSAxKSByZXR1cm4ge307XHJcbiAgICAvLyBRdWVyeSBzdHJpbmcgZXhpc3RzLCBwYXJzZSBpdCBpbnRvIGEgcXVlcnkgb2JqZWN0XHJcbiAgICBxcyA9IHFzLnN1YnN0cmluZygxKTsgLy8gUmVtb3ZlIHRoZSBcIj9cIiBkZWxpbWl0ZXJcclxuICAgIHZhciBrZXlWYWxQYWlycyA9IHFzLnNwbGl0KFwiJlwiKTtcclxuICAgIHZhciBxdWVyeU9iamVjdCA9IHt9O1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlWYWxQYWlycy5sZW5ndGg7IGkgKz0gMSkge1xyXG4gICAgICAgIHZhciBrZXlWYWwgPSBrZXlWYWxQYWlyc1tpXS5zcGxpdChcIj1cIik7XHJcbiAgICAgICAgaWYgKGtleVZhbC5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgdmFyIGtleSA9IGRlY29kZVVSSUNvbXBvbmVudChrZXlWYWxbMF0pO1xyXG4gICAgICAgICAgICB2YXIgdmFsID0gZGVjb2RlVVJJQ29tcG9uZW50KGtleVZhbFsxXSk7XHJcbiAgICAgICAgICAgIHF1ZXJ5T2JqZWN0W2tleV0gPSB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHF1ZXJ5T2JqZWN0O1xyXG59O1xyXG5cclxuZXhwb3J0cy5jcmVhdGVRdWVyeVN0cmluZyA9IGZ1bmN0aW9uIChxdWVyeU9iamVjdCkge1xyXG4gICAgaWYgKHR5cGVvZiBxdWVyeU9iamVjdCAhPT0gXCJvYmplY3RcIikgcmV0dXJuIFwiXCI7XHJcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHF1ZXJ5T2JqZWN0KTtcclxuICAgIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFwiXCI7XHJcbiAgICB2YXIgcXVlcnlTdHJpbmcgPSBcIj9cIjtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkgKz0gMSkge1xyXG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xyXG4gICAgICAgIHZhciB2YWwgPSBxdWVyeU9iamVjdFtrZXldO1xyXG4gICAgICAgIHF1ZXJ5U3RyaW5nICs9IGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodmFsKTtcclxuICAgICAgICBpZiAoaSAhPT0ga2V5cy5sZW5ndGggLSAxKSBxdWVyeVN0cmluZyArPSBcIiZcIjtcclxuICAgIH1cclxuICAgIHJldHVybiBxdWVyeVN0cmluZztcclxufTtcclxuXHJcbmV4cG9ydHMud3JhcEluZGV4ID0gZnVuY3Rpb24gKGluZGV4LCBsZW5ndGgpIHtcclxuICAgIHZhciB3cmFwcGVkSW5kZXggPSAoaW5kZXggJSBsZW5ndGgpOyBcclxuICAgIGlmICh3cmFwcGVkSW5kZXggPCAwKSB7XHJcbiAgICAgICAgLy8gSWYgbmVnYXRpdmUsIGZsaXAgdGhlIGluZGV4IHNvIHRoYXQgLTEgYmVjb21lcyB0aGUgbGFzdCBpdGVtIGluIGxpc3QgXHJcbiAgICAgICAgd3JhcHBlZEluZGV4ID0gbGVuZ3RoICsgd3JhcHBlZEluZGV4O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHdyYXBwZWRJbmRleDtcclxufTtcclxuIl19
