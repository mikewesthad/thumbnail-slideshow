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