// An amazingly handy remove function created by John Resig of jQuery.
// TODO: Move this into a more global "useful things" script.
if (Array.remove === undefined) {
  // Array Remove - By John Resig (MIT Licensed)
  Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
  };
}

if (Array.move === undefined) {
    Array.prototype.move = function (from, to) {
        this.splice(to, 0, this.splice(from, 1)[0]);
    };
}

// Allows us to use partials with precompiled templates.
Handlebars.registerHelper('partial', function(templateName,context){
    return new Handlebars.SafeString(Handlebars.templates[templateName](this));
});

function isObjectEmpty(object) {
      var isEmpty = true;
      for(keys in object) {
         isEmpty = false;
         break; // exiting since we found that the object is not empty
      }
      return isEmpty;
};


// Namespace
var IG = IG || {};


// Model - things that get and sort datas.

IG.Model = {

    errorCodes: {
        images: {
            1: 'No name entered. You have to give your images a unique name.',
            2: 'That name is already taken, try another unique name.',
            3: 'Your image must have a URL.'
        },
        galleries: {
            1: 'No name entered. You have to give your galleries a unique name.',
            2: 'That name is already taken, try another unique name.',
            3: 'The image width has to be a valid number.'
        }
    },

    defaultOptions: {
        galleries: {
            "showDetails": true,
            "thumbSize": "200px",
            "constrWidth": true,
            "showGrDescr": false,
            "showImgNames": false,
            "showImgDescr": false
        }
    },

    // parses the objects in the models
    // back into the JSON format that Cookie expects to see.
    jsonToString: function (dataArray) {
        var outputString = { "imageGroups": []},
            i = 0, grMax = dataArray.length,
            n = 0, imgMax = 0;

        for (i = 0; i < grMax; i++) {

            outputString.imageGroups[i] = {
                "name": dataArray[i].name,
                "description": dataArray[i].description,
                "images": [],
                "options": dataArray[i].options
            };

            if (dataArray[i].images.length > 0) {
                imgMax = dataArray[i].images.length;
                for (n = 0; n < imgMax; n++) {
                    outputString.imageGroups[i].images[n] = {
                        "name": dataArray[i].images[n].name,
                        "description": dataArray[i].images[n].description,
                        "url": dataArray[i].images[n].url
                    };
                };
            }
        };

        return JSON.stringify(outputString);
    },

    // Takes the string value of the data sent from Cookie
    // and parses it into something the IG app can use.
    stringToJSON: function(dataString) {
        return $.parseJSON(dataString);
    }



};



// #Actors

// ## ImageGallery
// Connects the Data to the ImageGallery Input Node
// which is required to save and retrieve form data.
IG.ImageGallery = function (settings) {
    this.inputNode,
    this.parentContainer,
    this.imageGroups = [];

    var self = this;

    $(this).on('datachange', $.proxy(this.updateInputNode, this));

    function init(settings) {
        var galleryData = {}, 
            newGroupSettings, newImageSettings,
            newImage, newGroup, i = 0, n = 0;

        // Strong type checking of settings values.
        // We can't continue without the parentContainer and the inputNode.
        if (settings.inputNode && typeof settings.inputNode === 'string' ) {
            self.inputNode = $(settings.inputNode);
        } else {
            $.error("no inputNode set. This must be a STRING, not a jQuery object ('.myNode' not $('.myNode').)");
        }

        if (settings.parentContainer && typeof settings.parentContainer === 'string') {
            self.parentContainer = $(settings.parentContainer);
        } else {
            $.error("no parentContainer set. This must be a STRING, not a jQuery object ('.myNode' not $('.myNode').)");
        }

        // on init, parse up the data that's already available and
        // generate our views with the known Gallery Objects.
        if (settings.data && typeof settings.data === 'object' && isObjectEmpty(settings.data) === false) {
            galleryData = settings.data.imageGroups;

            for (i = 0; i < galleryData.length; i++) {
                newGroupSettings = galleryData[i];

                newGroup = self.createImageGroup(newGroupSettings, "push");


                // if there's images inside, create them too.
                if (galleryData[i].images.length > 0) {
                    for (n = 0; n < galleryData[i].images.length; n++) {
                        newImageSettings = galleryData[i].images[n];
                        newImage = newGroup.createImage(newImageSettings, "push");
                    }
                }

                $(self).trigger('datachange');

            }


        }
    }

    // fire in zee hole!
    init(settings);

};
    
IG.ImageGallery.prototype.getImageGroups = function () {
    return this.imageGroups;
};

// ### updateInputNode
// takes the currently stored JSON object,
// and pushes it back to the Form InputNode.
IG.ImageGallery.prototype.updateInputNode = function () {
    var data = this.imageGroups;
    this.inputNode.attr('value', IG.Model.jsonToString(data)); 
    $(this).trigger('updateview');
};


// ### createImageGroup
// creates new groups based on the passed settings.
// Must have at least a unique name value.
IG.ImageGallery.prototype.createImageGroup = function (settings, order) {
    var self = this,
        currentGroups = self.getImageGroups(),
        imageGroupObject, groupSettings = {},
        defaultSettings = IG.Model.defaultOptions.galleries;

    if (!settings.name || settings.name === '') {
        return { "error": 1 };
    } else {
        // check if this group we're adding is already in there.
        imageGroupObject = $.grep(currentGroups, function (val, idx) {
          return currentGroups.name === val.name;
        });

        if (imageGroupObject.length > 0) {
            // if it exists, return the error that tells the user so.
            return { "error": 2 };

        } else if (imageGroupObject.length === 0) {

            // if options is an empty object, pull everything from defaults.
            if (!settings.options || isObjectEmpty(settings.options) === true) {
                groupSettings = defaultSettings;
            } else {
            // load up the settings, if any value is missing pull
            // from the defaultSettings object.
                for (setting in defaultSettings) {
                    if (settings.options[setting] === undefined) {
                        groupSettings[setting] = defaultSettings[setting]
                    } else {
                        groupSettings[setting] = settings.options[setting];
                    }
                }
            }


            var newGroup = new IG.ImageGroup({
                "name": settings.name,
                "description": settings.description || '',
                "options": groupSettings
            });

            // add an index number to the groupObject. It is simply used
            // to create another unique identifier.
            newGroup["id"] = currentGroups.length;

        }

        // bind save trigger to newGroup
        $(newGroup).on('datachange', $.proxy(self.updateInputNode, self));

        // add the new group to the master list.
        if (order === "push") {
            this.imageGroups.push(newGroup);
        } else {
            this.imageGroups.unshift(newGroup);
        }
        $(self).trigger('datachange');

        // return the newGroup so we can do more stuff to it,
        // such as add images.
        return newGroup;

    } 
};


// ### ImageGallery: deleteImageGroup
// Will not delete the only image group in the array. Must have at least 1.
IG.ImageGallery.prototype.deleteImageGroup = function (groupObject) {
        var imageGroups = this.getImageGroups(),
            i = 0, max = imageGroups.length;
        // check if the group we want is actually in there.
        if (max > 1) {
            for (i; i < max; i++) {
                // if we find it, kill it!
                if (groupObject.name === imageGroups[i].name) {
                  this.imageGroups.remove(i);
                  $(this).trigger('datachange');
                  return;
                }
            }
        } else {
            return false;
        }
};

IG.ImageGallery.prototype.editImageGroup = function (groupObject, option, value) {
    var groupNameNode;

    if (option === "name") {
        groupNameNode = this.getImageGroupByName(value);
        if (groupNameNode !== false) {
            return {"error": 2}
        } 
    } 

    if (typeof option === "object") {
        for (setting in option) {
            groupObject.options[setting] = option[setting];
        }
    } else {
        groupObject[option] = value;
    }

    $(this).trigger('datachange');
    
    // return the modified object for further use.
    return groupObject; 

};

IG.ImageGallery.prototype.getImageGroupByName = function (groupName) {
    var i = 0, max = this.imageGroups.length, result = false,
        imageGroups = this.getImageGroups();

    // check if the image we want is actually in there.
    for (i; i < max; i++) {
        // if we find it, edit it with new values
        if (groupName === imageGroups[i].name) {
            // return the modified object for further use.
            result = imageGroups[i];
        }
        
    } 

    return result;
};

// ## ImageGallery: findImage
// locates an image Node based on the image name string and group name string.
IG.ImageGallery.prototype.findImage = function(imageName, groupName) {
    var targetGroup = this.getImageGroupByName(groupName);

    if (targetGroup !== false) {
        return targetGroup.getImageByName(imageName);
    }
};


// ### ImageGallery: moveGroup
// Used to re-order groups in the array.
// the array order is also the group display order.
IG.ImageGallery.prototype.moveGroup = function(fromName, toName) {
    var currentGroups = this.getImageGroups(),
        i = 0,
        max = currentGroups.length,
        fromIndex, toIndex;

    for (i; i < max; i++) {
        if (currentGroups[i].name == fromName) {
            fromIndex = i;
        }
        if (currentGroups[i].name == toName) {
            toIndex = i;
        }
    }

    if (fromIndex !== undefined && toIndex !== undefined) {
        this.imageGroups.move(fromIndex, toIndex);
        $(this).trigger('datachange');

    } else {
        return false;
    }
};

// --------------------------------- //

// ## ImageGroup
// The collection of images.
IG.ImageGroup = function(settings) {
    this.name = settings.name || "";
    this.description = settings.description || "";
    this.images = [];
    this.options = settings.options || {};
};


// ### ImageGroup: createImage
// Creates an instance of the IG.Image class and adds it to the ImageGroup.
IG.ImageGroup.prototype.createImage = function (settings, order) {
    var self = this,
        newImage, existingImages = [], 
        newImageIndex,
        imageSettings = settings;

    if (settings.name === '') {
        return { "error": 1 };
    }
    if (!settings.url || settings.url === '') {
        return { "error": 3 };
    } 

    // if the image name already exists in this gallery, find it.
    existingImages = this.getImageByName(imageSettings.name);

    if (existingImages !== false) {
        // if it exists, return the error that tells the user so.
        return { "error": 2 };
    } else {
        // we're in the clear, hooray!
        newImage = new IG.Image(imageSettings, this.name);

        if (order === "push") {
            self.images.push(newImage);
        } else {
            self.images.unshift(newImage);
        }
        $(this).trigger('datachange');
        return newImage;
    }
    

};

// ### ImageGroup: deleteImage
// Removes an image from the Group.
IG.ImageGroup.prototype.deleteImage = function(imageObject) {
    var images = this.getImages(),
        i = 0, max = images.length;
    // check if the image we want is actually in there.
    for (i; i < max; i++) {
        // if we find it, kill it!
        if (imageObject.name === images[i].name) {
            this.images.remove(i);
            $(this).trigger('datachange');
          return;
        }
    }

};

// ### ImageGroup: editImage
// Updates an Image Object's settings within this group.
IG.ImageGroup.prototype.editImage = function(imageObject, settings) {
    var i = 0, max = this.images.length;

    for (i; i < max; i++) {
        if (this.images[i].name === imageObject.name) {
            for (attribute in settings) {
                this.images[i][attribute] = settings[attribute];
            }

            $(this).trigger('datachange');
        }    
    }

};

// ### ImageGroup: getImages
// Returns the array of Image Objects within this group.
IG.ImageGroup.prototype.getImages = function() { 
    return this.images;
};

// ### ImageGroup: getImageByName
// Returns an Image Object by passing in the name string.
// or returns false if none is found.
IG.ImageGroup.prototype.getImageByName = function(imageName) {
    var result = false, 
        i = 0, 
        max = this.images.length;

    for (i; i < max; i++) {
        if (imageName === this.images[i].name) {
          result = this.images[i];
        }
    };

    return result;
};

// ### ImageGroup: moveImage
// Used to re-order images in the array.
// the array order is also the image display order.
IG.ImageGroup.prototype.moveImage = function(fromName, toName) {
    var currentImages = this.getImages(),
        i = 0,
        max = currentImages.length,
        fromIndex, toIndex;

    for (i; i < max; i++) {
        if (currentImages[i].name == fromName) {
            fromIndex = i;
        }
        if (currentImages[i].name == toName) {
            toIndex = i;
        }
    }

    if (fromIndex !== undefined && toIndex !== undefined) {
        this.images.move(fromIndex, toIndex);
        $(this).trigger('datachange');

    } else {
        return false;
    }
};

// ### ImageGroup: resort Images
// Takes an array of Images names, re-sorts the image Objects
// based on the order of the names.
IG.ImageGroup.prototype.resortImages = function(imageNameArray) {
    var i = 0, imageNode,
        currentImages = this.getImages(),
        newImageArray =[];

    for (i = 0; i < imageNameArray.length; i++) {
        imageNode = this.getImageByName(imageNameArray[i]);

        if (imageNode === false) {
            return false;
        } else {
            newImageArray.push(imageNode);
        }
    }

    // we've accounted for all the images and all imageNames
    // returned a valid object, replace the new array with the old one.
    if (currentImages.length === newImageArray.length) {
        this.images = newImageArray;
        $(this).trigger('datachange');
    }
};



/// ------------------------------ //

// ## IG_Image
// The individual Images.
IG.Image = function(settings, groupName) {
    if (!settings.name || settings.name === "") {
        return false;
    }
    if (!settings.url || settings.url === ""){
        return false;
    }
    if (!groupName || groupName === ""){
        return false;
    }

    this.groupName = groupName;
    this.name = settings.name;
    this.description = settings.description || "";
    this.url = settings.url;
};


// # VIEW CONTROLLERS

IG.GalleryController = function (model){
    this.parentContainer = $(model.parentContainer);
    this.imageGroup = IG.ImageGroupView;
    this.image = IG.ImageView;
    this.gallery = model;
    this.resources = {};
    var self = this;

    this.renderAll();
    this.bindEvents();
    this.bindEffects();


    // init triggers that the views will fire here.
    $(this).on('hidemodal', $.proxy(self.hideModal, self));
    $(this.gallery).on('updateview', $.proxy(this.updateView, this));
};

// ### GalleryController: updateView
IG.GalleryController.prototype.updateView = function() {

    $('#imageGalleryWidget').find('.images').sortable("destroy");

    // make sure the parent is empty.
    this.parentContainer.empty();

    this.renderAll();

};

// ### GalleryController: renderAll
// Renders the view for all image groups and their images.
IG.GalleryController.prototype.renderAll = function(callback) {
    var self = this,
        imageGroups = this.gallery.getImageGroups();

    // create the modal container if there isn't one.
    if ($('#editModal').length === 0) {
        $('body').prepend('<div id="editModal" class="modal fade" />');
    }

    $.each(imageGroups, function(){
        var newGroupView = new self.imageGroup(),
            groupName = this.name,
            groupImages = this.getImages(),
            newGroupNode, imagesBlock;

        self.parentContainer.append(newGroupView.render(this));
        newGroupNode = self.parentContainer.find('.imageGroup[name="'+groupName+'"]');
        imagesBlock = newGroupNode.find('.images');

        // load the images into the template.
        $.each(groupImages, function(){
            var newImageView = new self.image();
            this.groupName = groupName;

            imagesBlock.append(newImageView.render(this));
        });
        
    });

    // jQuery UI Sortable on Images. Has to be called every render.
    $('#imageGalleryWidget').find('.images').sortable({
        placeholder: 'imageGhost',
        update: function(event, ui){
            self.processImageOrder(ui.item);

        }
    });


};


// ### GalleryController: bindEffects
// Non-essential bindings that make the UI look nicer.
IG.GalleryController.prototype.bindEffects = function() {
    $('body').delegate('.image', 'hover', function(){
        $(this).find('.buttons, .imgDetails').fadeToggle('fast');
    });

};

// ### GalleryController: loadAvailableImages
// Makes a call to the server and loads up the first page of available resources
// And stores it in the controller for template reference.
IG.GalleryController.prototype.getAvailableResources = function(page, callback) {
    // Restful call: /admin/resources/all.json
    // just images: /admin/resources/image.json
    // page: /admin/resources/image/1.json
    var self = this,
        getUrl = '/admin/resources/image/'+ page +'.json';

    $.ajax({
        url: getUrl,
        dataType: 'json',
        type: 'GET',
        success: function(data) {
            self.resources[data.page] = data;
            if (callback && typeof callback === "function") {
                callback(data);
            }
        }
    });

};


//### GalleryController: createResourceSettings
// Parses the data returned from getAvailableResources
// and makes it usable in the template partial "resourceSelector.tmpl" 
// for the new Image Modal.
IG.GalleryController.prototype.createResourceSettings = function(resourceData) {
    var resourceData = resourceData || this.resources, i = 0, 
        resGroup = [],
        settings = {
            availPages: resourceData.pages,
            currentPage: resourceData.page,
            resImages: [],
            firstPage: true,
            lastPage: false
        };

        if (settings.currentPage !== 1) {
            settings.firstPage = false;
        }
        if (settings.currentPage === settings.availPages) {
            settings.lastPage = true;
        }
        if (settings.availPages > 1) {
            settings.pages = true;
        }

        settings.resImages = resourceData.resources;

        return settings;
};

IG.GalleryController.prototype.resourcePagination = function(pageNode) {
    var listWidth = $(".resourceList").width(),
        wrapperDiv = $(".resourceList .wrapper"),
        rowNode = $(".resourceList .row"),
        paginator = $('.paginator'),
        currentRowNode = rowNode.filter('.active'),
        nextRow,
        currentPageNum = parseFloat(currentRowNode.attr('data-page'), 10),
        pageLength = parseFloat($(".resourcePages .total").text(), 10),
        diff = "",
        resources = {};

    if (pageNode.hasClass("disabled") === false) {

        // determine our page direction based on which button was used.
        if (pageNode.hasClass('prev')) {
            diff = "+";
            nextRow = currentPageNum - 1;
        }

        if (pageNode.hasClass('next')) {
            diff = "-";
            nextRow = currentPageNum + 1;
        }

        // update the available paginators based on where we are.
        if (nextRow === 2) {
            paginator.filter('.prev').removeClass('disabled');
        }
        if (nextRow !== pageLength) {
            paginator.filter('.next').removeClass('disabled');
        }
        if (nextRow === pageLength) {
            paginator.filter('.next').addClass('disabled');
        }
        if (nextRow === 1) {
             paginator.filter('.prev').addClass('disabled');
        }
        
        // failsafe - kill the action if going out of bounds.
        if (nextRow == 0 || nextRow === pageLength+1) {
            return;
        } else {
            currentRowNode.removeClass('active');

            if (rowNode.filter('[data-page="'+nextRow+'"]').length === 0) {
                // ajax-call the next set of resources
                // update width of wrapper - listWidth * row count
                    this.loadResourceList(nextRow);
            }

            rowNode.filter('[data-page="'+nextRow+'"]').addClass('active');

            wrapperDiv.animate({
                "marginLeft": diff + "=" + listWidth
            }, 200);
            $(".resourcePages .counter .num").text(nextRow);
        }
    }
};
// TODO: Add refresh feature to load new images.
IG.GalleryController.prototype.loadResourceList = function(pageNum) {
    var self = this;
        modalTemplate = Handlebars.templates['resourceList.tmpl'],
        resourceListContainer = $(".resourceList .wrapper"),
        resourceSettings = {};


    // if we don't have a copy saved in the resources controller object
    // fetch the page.
    if (!self.resources[pageNum] || isObjectEmpty(self.resources[pageNum])) {
        resourceListContainer.append('<div class="row spinner" />');

        self.getAvailableResources(pageNum, function(data){
            resourceSettings = self.createResourceSettings(data);
            resourceListContainer.append(modalTemplate(resourceSettings));
            resourceListContainer.find('.spinner').remove();
        });
    } else {
        resourceSettings = self.createResourceSettings(self.resources[pageNum]);
        resourceListContainer.append(modalTemplate(resourceSettings));
    }
};

// ### GalleryController: showImageModal
IG.GalleryController.prototype.showImageModal = function(imageNode, option) {
    var modalTemplate, resourceTemplate,
        imageSettings = {},
        self = this;

    if (imageNode) {
        for (setting in imageNode) {
            if (typeof imageNode[setting] !== "function") {
                imageSettings[setting] = imageNode[setting];
            }
        }
    };

    if (option === "delete") {
        modalTemplate = Handlebars.templates['deleteImage.tmpl'];

        $('#editModal').append(modalTemplate(imageSettings));

    } else {
        modalTemplate = Handlebars.templates['editImageTemplate.tmpl'];


        // after the modal is appended, load the resourceList.
        this.getAvailableResources(1, function(data){
            // update our controller copy while we're at it.
            self.resources["1"] = data;
            imageSettings["resources"] = self.createResourceSettings(self.resources["1"]);

            $('#editModal').append(modalTemplate(imageSettings));

            self.loadResourceList(1);

        });




    }

    $('#editModal').modal().css("top", "50%");
};

IG.GalleryController.prototype.showImageGroupModal = function(groupNode, option) {
    var modalTemplate;

    if (option === "delete") {
        modalTemplate = Handlebars.templates['deleteImageGroup.tmpl'];
    } else {
        modalTemplate = Handlebars.templates['newImageGroup.tmpl'];
    }

    $('#editModal').append(modalTemplate(groupNode || ''));
    $('#editModal').modal().css("top", "50%");

};

IG.GalleryController.prototype.hideModal = function() {
    $('#editModal').modal("hide");
};


// ### GalleryController: checkFormSubmit
// Used for creating and editing images and imageGroups.
// Checks that the form values are valid, and returns visual errors if they're not.
IG.GalleryController.prototype.checkImageForm = function(buttonNode, editMode, formValues) {
    var self = this,
        alertBox = $('#editModal').find('.alert'),
        imageGroupName = '', 
        imageSettings = self.createImageJSON(formValues),
        imageNode, imageGroup;

    // clear any class states previously added to the alertbox.
    alertBox.removeClass('alert-error alert-warning').empty();

    // URL should also be hard required.
    if (imageSettings.url === '') {
        
        $('#editModal').find('input[name="imageURL"]')
          .closest('.field').addClass('control-group error');

        returnError(3);
        return;
    }

    // Name is always required, and we won't continue without it.
    // first check if any name has been entered.
    if (imageSettings.name === '') {

        $('#editModal').find('input[name="imageName"]')
          .closest('.field').addClass('control-group error');

        returnError(1);
        return;

    } else {
        imageGroupName = buttonNode.attr('data-groupName');
        imageGroup = this.gallery.getImageGroupByName(imageGroupName);
        imageNode = imageGroup.getImageByName(imageSettings.name);

        // if this is NOT an edit, and
        // if imageName is the same as another image in this group,
        // also throw an error and tell the user about it.
        if (editMode === "false" && imageNode !== false) {
            $('#editModal').find('input[name="imageName"]')
            .closest('.field').addClass('control-group error');

            returnError(2);
            return;
        }

        // it's edit mode and we found the image, hooray!
        if (editMode === "true" && imageNode !== false){       
            $(self).trigger('hidemodal');
            imageGroup.editImage(imageNode, imageSettings);

        }

        // we're in the clear, create a new image!
        if (editMode === "false" && imageNode === false) {
            $(self).trigger('hidemodal');
            imageGroup.createImage(imageSettings);
        }

    }

    function returnError(code) {
        alertBox.addClass('alert-error')
          .append(IG.Model.errorCodes.images[code])
          .show(100);
    };

};

IG.GalleryController.prototype.checkDeleteImage = function(buttonNode) {
    var imageName = buttonNode.attr('data-imageName'),
        groupName = buttonNode.attr('data-groupName'),
        groupNode = this.gallery.getImageGroupByName(groupName),
        imageNode = groupNode.getImageByName(imageName);
    
    if(groupNode !== false) {
        groupNode.deleteImage(imageNode);  
        $(this).trigger('hidemodal');
    }

};

IG.GalleryController.prototype.checkDeleteGroup = function(groupName) {
    var groupNode = this.gallery.getImageGroupByName(groupName);

    if (groupNode !== false) {
        this.gallery.deleteImageGroup(groupNode);
        $(this).trigger('hidemodal');

    }
};

IG.GalleryController.prototype.checkEditGroupName = function(groupName, newName, buttonNode) {
    var groupNode = this.gallery.getImageGroupByName(groupName),
        newGroup = this.gallery.getImageGroupByName(newName);

    // clear out any error popovers
    buttonNode.popover('destroy');

    if (newName === '') {

        showPopover(1);

    } else if (groupName === newName) { 

        // close the input view.
        this.groupNameEditClose(buttonNode);

    } else {
        // That name is already taken by another group.
        if (newGroup !== false) {
            // requires bootstrap popover.

            showPopover(2);

        } else {
            this.gallery.editImageGroup(groupNode, "name", newName);
            // close the input view.
            this.groupNameEditClose(buttonNode);
        }
    }

    function showPopover(errorCode) {

        buttonNode.popover({
            title: "Oops!",
            placement: "top",
            content: IG.Model.errorCodes.galleries[errorCode],
            trigger: "manual"
        }).popover("show");

    }

};

IG.GalleryController.prototype.groupNameEditClose = function(targetNode) {
        targetNode.closest('.editGroupName').hide();
        targetNode.closest('.editGroupName').siblings('.groupName').show();
};

IG.GalleryController.prototype.checkImageGroupForm = function(buttonNode, formValues) {
    var self = this,
        alertBox = $('#editModal').find('.alert'),
        nameValue = $.grep(formValues, function (val, idx) {
            return val.name === "groupName"; 
        }),
        imageGroupName = nameValue[0].value,
        imageGroup = this.gallery.getImageGroupByName(imageGroupName);

    // clear any class states previously added to the alertbox.
    alertBox.removeClass('alert-error alert-warning').empty().hide();

    // Name is always required, and we won't continue without it.
    // first check if any name has been entered.
    if (imageGroupName === '') {

        $('#editModal').find('input[name="groupName"]')
          .closest('.field').addClass('control-group error');

        alertBox.addClass('alert-error')
          .append(IG.Model.errorCodes.galleries['1'])
          .show(100);

    } else {
        if (imageGroup !== false) {
            $('#editModal').find('input[name="groupName"]')
              .closest('.field').addClass('control-group error');

            alertBox.addClass('alert-error')
              .append(IG.Model.errorCodes.galleries['2'])
              .show(100);
        } else {
            // in the clear, make a group!
            this.gallery.createImageGroup({"name": imageGroupName});
            $(this).trigger('hidemodal');

        }

    }
};

IG.GalleryController.prototype.createImageJSON = function(formValues) {
    var imageObject = {};
    $.each(formValues, function(){
        if(this.name == "imageName") 
          imageObject["name"] = this.value;
        if(this.name == "imageDescr")
          imageObject["description"] = this.value;
        if(this.name == "imageURL")
          imageObject["url"] = this.value;
    });

    return imageObject;  
};

IG.GalleryController.prototype.processImageOrder = function(targetObject) {
    var imageArray = targetObject.closest('.images').find('.image'),
        i = 0, max = imageArray.length, imageName = '',
        imageNameArray = [],
        imageGroup = this.gallery.getImageGroupByName(targetObject.attr('data-groupName'));

        for (i = 0; i < max; i++) {
            imageName = $(imageArray[i]).attr("name");
            imageNameArray.push(imageName);
        }

        imageGroup.resortImages(imageNameArray);
};


IG.GalleryController.prototype.toggleShowDetails = function(buttonNode, targetDetails) {
    var groupName = buttonNode.closest('.imageGroup').attr('name'),
        groupNode = this.gallery.getImageGroupByName(groupName),
        self = this,
        openState;

    targetDetails.slideToggle(function() {
        $(this).toggleClass("open");

        if ($(this).hasClass("open")) {
            buttonNode.find('span').text("Hide");
            openState = true;
        } else {
            buttonNode.find('span').text("Show");
            openState = false;
        }

        self.gallery.editImageGroup(groupNode, {
            "showDetails": openState
        });
    });
};


IG.GalleryController.prototype.triggerGroupSettingChange = function(groupName, inputNode) {
    var groupNode = this.gallery.getImageGroupByName(groupName),
        inputValue = inputNode.attr('value'),
        isSelected = inputNode.attr('checked'),
        inputName = inputNode.attr('name'),
        settingsObj = {};

    // kill any active popovers.
    $('.setting').popover("destroy");

    switch (inputName) {
        case "groupDescription":
            this.gallery.editImageGroup(groupNode, "description", inputValue);
            return;
       case "thumbSize":
            // check it it's a number, and make sure it has the "px" suffix.
            inputValue = parseInt(inputValue, 10);
            if (typeof inputValue === "number" && isNaN(inputValue) === false) {
                inputValue = inputValue + "px";
                settingsObj[inputName] = inputValue;

                this.gallery.editImageGroup(groupNode, settingsObj);
            } else {
                // not a number, show error.
                showPopover(3);
            }
            return;
        case "showImgNames":
        case "showGrDescr":
        case "showImgDescr":
            if (isSelected === "checked") {
                isSelected = true;
            } else {
                isSelected = false;
            }
            settingsObj[inputName] = isSelected;
            this.gallery.editImageGroup(groupNode, settingsObj);
       default:
          break;
    }

    // if it's the radio for thumb constraints, treat differently.
    if (inputName.indexOf("_thumbConstr") > -1) {
        if (inputValue === "wide") {
            this.gallery.editImageGroup(groupNode, {"constrWidth": true});
            return;
        } else {
            this.gallery.editImageGroup(groupNode, {"constrWidth": false});
            return;
        }
    }

   function showPopover(errorCode) {

        inputNode.popover({
            title: "Oops!",
            placement: "top",
            content: IG.Model.errorCodes.galleries[errorCode],
            trigger: "manual"
        }).popover("show");

    };

};

//### GalleryController: bindEvents
// Events that only need to be called once.
// TODO: Emulate backbone's awesome click event registry
IG.GalleryController.prototype.bindEvents = function() {
    var self = this,
    body = $('body'),
    imageGalleryWidget = $('#imageGalleryWidget');

    // IMAGE EVENTS // ---------------------------------------------------

    // new image modal
    imageGalleryWidget.delegate('.addImage', 'click.addImage', function() {
        var groupName = $(this).attr('data-groupName');
        self.showImageModal({'groupName': groupName});
    });

    // edit image modal
    imageGalleryWidget.delegate('.editImage', 'click.editImage', function() {
        var imageName = $(this).attr('data-imageName');
        var groupName = $(this).attr('data-groupName');
        var targetImage = self.gallery.findImage(imageName, groupName);
        self.showImageModal(targetImage);
    });

    imageGalleryWidget.delegate('.deleteImage', 'click.deleteImage', function() {
        var imageName = $(this).attr('data-imageName');
        var groupName = $(this).attr('data-groupName');
        var targetImage = self.gallery.findImage(imageName, groupName);
        self.showImageModal(targetImage, "delete");
    });

    // MODAL EVENTS // ---------------------------------------------------

    // empty the modal when it closes.
    $('#editModal').on('hidden', function(){
      $(this).empty().removeAttr('style');
      $('.modal-backdrop').hide();
    }); 

    body.delegate('#editModal .saveImage', 'click.saveImage', function() {
        var editMode = $('#editImageForm').attr('edit');
        var formValues = $('#editImageForm').serializeArray();

        self.checkImageForm($(this), editMode, formValues);
    });

    body.delegate('#editModal .saveGroup', 'click.saveGroup', function() {
        var formValues = $('#newGroupForm').serializeArray();

        self.checkImageGroupForm($(this), formValues);
    });

    body.delegate('#editModal .confirmDeleteImage', 'click.confirmDel', function() {
        self.checkDeleteImage($(this));    
    });

    body.delegate('#editModal .confirmDeleteGroup', 'click', function(){
        var groupName = $(this).attr('data-groupName');
        self.checkDeleteGroup(groupName);
    });

    // MODAL: RESOURCE SELECTOR EVENTS // --------------------------------------
    body.delegate('#resourceManager .paginator', 'click', function() {
        self.resourcePagination($(this));
    });

    body.delegate('#resourceManager .resource', 'click', function(){
        var imageUrl = $(this).attr('data-url');
        $(".modal").find('.form input[name="imageURL"]').attr('value', imageUrl);
        $(".modal").find('.form input[name="imageName"]').attr('value', $(this).text());
        $(this).addClass('selected');
        $(this).siblings('.resource').removeClass('selected');
    });

    // IMAGE GROUP EVENTS // ---------------------------------------------------

    // Show/Hide Toggle for the Image Group Details
    imageGalleryWidget.delegate('.groupDetailsToggle', 'click.toggle', function() {
        var targetDetails = $(this).closest('.imageGroup').find('.groupDetails');
        var buttonNode = $(this)

        self.toggleShowDetails(buttonNode, targetDetails);

    });

    // Edit Group Name Link/Input
    imageGalleryWidget.delegate('.editGroupTitle', 'click', function() {
        var groupName = $(this).attr('data-groupname');
        $(this).closest('.groupName').hide();
        $('.editGroupName').filter('[data-groupname="'+groupName+'"]').show();
    });

    imageGalleryWidget.delegate('.groupNameCancel', 'click.groupNameCancel', function() {
        self.groupNameEditClose($(this));
    });

    // hides the popover on group title input focus.
    imageGalleryWidget.delegate('.groupNameInput', 'focus', function() {
        $('.groupNameSave, .groupNameInput').popover('destroy');
    });

    imageGalleryWidget.delegate('.groupNameSave', 'click', function(){
        var groupName = $(this).closest('.editGroupName').attr('data-groupname'),
            newName = $(this).siblings('.groupNameInput').attr('value');

            self.checkEditGroupName(groupName, newName, $(this));
    });

    imageGalleryWidget.delegate('.deleteGroup', 'click', function(){
        var groupName = $(this).attr('data-groupName');
        self.showImageGroupModal(self.gallery.getImageGroupByName(groupName), "delete");
    });

    imageGalleryWidget.delegate('.groupDetails .setting', 'change', function() {
        var groupName = $(this).closest('.imageGroup').attr('name');

        self.triggerGroupSettingChange(groupName, $(this));
    });

    // new image group modal - showImageGroupModal
    imageGalleryWidget.delegate('.newGroup', 'click.newGroup', function() {
        self.showImageGroupModal();
    });

};

// #VIEWS

IG.ImageGroupView = function (settings) {
  this.template = Handlebars.templates['imageGroupTemplate.tmpl'];

  this.render = function(imageGroup) {
    return this.template(imageGroup);
  }
};

IG.ImageView = function (settings) {
  this.template = Handlebars.templates['imageTemplate.tmpl'];

  this.render = function(image) {
    return this.template(image);
  }
};



