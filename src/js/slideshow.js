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