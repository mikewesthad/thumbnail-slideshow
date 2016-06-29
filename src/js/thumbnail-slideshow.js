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