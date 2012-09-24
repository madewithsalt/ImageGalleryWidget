// IMAGE GALLERY WIDGET

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


var ImageGallery = function(parentContainer, data) {
  // will require the json-converted data hash to send to the dataModel
  // example data: { "image" : "thing.jpg" }
  var galleryInputNode = $('#imageGalleryData');
  // init the Gallery Model
  this.Gallery.init(data, this.ImageGroupModel, this.ImageModel);
  // connect the input node to the dataSaver method
  this.Gallery.dataSaver.init(this.Gallery, galleryInputNode);

  // connect the views to the datamodel and init
  this.GalleryController.init(parentContainer, this.Gallery, this.ImageView, this.ImageGroupView);

  // init any controllers
};

ImageGallery.prototype.Gallery = {
  init: function(data, imageGroupModel, imageModel) {
    var self = this;
    // define the imageGroup model locally
    this.imageGroupModel = imageGroupModel;
    this.imageModel = imageModel
    // define the array to place imagegroup Models
    this.imageGroups = [];

    // build image Groups from the existing data.
    if (data.imageGroups && data.imageGroups.length > 0) {
      $.each(data.imageGroups, function() {
        var newGroup = self.createGroup(this);

        self.imageGroups.push(newGroup);
      });

      $(this).trigger('datachange');

    }



  },

  errorCodes: {
    images: {
      1: 'No name entered. You have to give your images a unique name.',
      2: 'That name is already taken, try another unique name.'
    },
    galleries: {
      1: 'No name entered. You have to give your galleries a unique name.',
      2: 'That name is already taken, try another unique name.'
    }
  },

  createGroup: function(imageGroupObject) {
    var self = this;
    // imageGroupObject is a JSON object,
    // and must contain at least a UNIQUE name value.
    var currentGroups = self.getImageGroups();

    // check if this group we're adding is already in there.

    currentGroups = $.grep(currentGroups, function (val, idx) {
      return imageGroupObject.name === val.name;
    });

    if (currentGroups.length === 0) {
      var newGroup = new self.imageGroupModel(self.imageModel, {
        name: imageGroupObject.name,
        description: imageGroupObject.description
      });
      
      // bind save trigger to newGroup
      $(newGroup).on('updategallery', $.proxy(self.updateGallery, self));


      // if we know this object has images in it, 
      // create those image objects too.
      $.each(imageGroupObject.images, function(){
          newGroup.createImage({
            name: this.name,
            description: this.description,
            url: this.url
          });
      });

      return newGroup;

    } else {
      // TODO: if the group name already exists, what do we do?
      // for now, we call editGroup.
      self.editGroup(imageGroupObject);
    }


  },

  editGroup: function(imageGroupObject) {
    // update an existing Group Object
    var self = this;
    var existingGroup = self.getImageGroups();

    $.grep(existingGroup, function (val, idx) {
        if (imageGroupObject.name === val.name) {
          self.imageGroups.remove(idx);
          self.imageGroups.push(self.createGroup(imageGroupObject));
          $(self).trigger('datachange');
        }
    });

  },

  deleteGroup: function(imageGroupObject) {
    // check if this group we're adding is already in there.
    var groupIndex = $.grep(this.imageGroups, function (val, idx) {
      if (imageGroupObject.name === val.name) {
        return idx
      }
    });
    if (groupIndex != undefined){
      this.imageGroups.remove(groupIndex);
      $(this).trigger('datachange');

    }

  },

  getImageGroups: function() {
    return this.imageGroups;
  },

  getImageGroup: function (searchValue) {
    var self = this;
    var knownGalleries = self.getImageGroups();
    var result = false;
    var targetName;

    if (typeof searchValue == "string") {
      targetName = searchValue;
    

      $.grep(knownGalleries, function (val, idx) {
        if (targetName === val.name){
            result = {"index": idx, "object": val};
        }
      });
    }
        
    return result;
  },

  getImage: function(imageName, groupName) {
    var self = this;
    var knownGalleries = self.getImageGroups();
    var result = false;
    var imageGroup, targetName;

    if (typeof imageName == "string") {
      targetName = imageName;
      imageGroup = self.getImageGroup(groupName);
    
      $.grep(knownGalleries[imageGroup.index].images, function (val, idx) {
          if (targetName === val.name) {
            result = {"index": idx, "object": val}
          }
      });
    }
    return result;
  },

  updateGallery: function() {
    $(this).trigger('datachange');
  },

  parseGalleryData: function() {
    // parses the objects in the models
    // back into the JSON format that Cookie expects to see.
    var outputObject = { "imageGroups": []};

    $.each(this.imageGroups, function() {
      var parsedGroup = {
          "name": this.name,
          "description": this.description,
          "images": []
        }
      

      $.each(this.images, function(){
          parsedGroup["images"].push({
            "name": this.name,
            "description": this.description,
            "url": this.url
          });
      });

      outputObject["imageGroups"].push(parsedGroup);

    });

    

    return outputObject;

  },

  dataSaver: {

    init: function(dataModel, domNode) {
    // connects the data model to the dom element we "save" the JSON 
    // object to so it can get saved back to the DB.
      this.domNode = domNode;
      this.dataModel = dataModel;

      $(this.dataModel).on('datachange', $.proxy(this.updateNode, this));
    },

    updateNode: function() {
      var stringValue;

      stringValue = JSON.stringify(this.dataModel.parseGalleryData());
      this.domNode.attr('value', stringValue);
      //console.log('saved to input', stringValue);
    }
  }

} // end dataModel

ImageGallery.prototype.ImageGroupModel = function (ImageModel, settings) {
  this.name  = settings.name || '';
  this.description = settings.description || '';
  this.images = [];
  this.imageModel = ImageModel;
  this.model = this;
  

  this.createImage = function (settings) {
    var self = this;
    var newImage, existingImages, newImageIndex;
    if(settings.name == ''){
      return {"error": 1};
    } else {
      existingImages = $.grep(this.images, function (val, idx) {
        return settings.name === val.name;
      });
      
      if (existingImages.length > 0) {
        return {"error": 2};
      } else {
        newImage = new self.imageModel(settings);
        this.images.push(newImage);

        $(this).trigger('updategallery');

        return {"index": this.images.length -1, "object": newImage};
      }
    }
  };

  this.deleteImage = function (imageObject) {
    // check if this group we're adding is already in there.
    var imageIndex = $.grep(this.images, function (val, idx) {
      if (imageObject.name === val.name) {
        return idx
      }
    });
    if (imageIndex != undefined){
      this.images.remove(imageIndex);
      $(this.model).trigger('updategallery');

    }
  };

  this.editImage = function (imageObject, settings) {
    // update an existing Image Object
    var self = this;

    $.grep(self.images, function (val, idx) {
        if (imageObject.name === val.name) {
          self.images.remove(idx);
          self.images.push(self.createImage(imageObject, settings));
          $(self.model).trigger('updategallery');
        }
    });    
  };

  this.getImages = function() {
    return this.images;
  };

  this.getImage = function(imageName) {
    var result = false;
    $.grep(this.images, function (val, idx) {
        if (imageName == val.name) {
          result = {"index": idx, "object": val};
        }
    });

    return result;
  };
} // end ImageGroupModel

ImageGallery.prototype.ImageModel = function(options) {
    this.url = options.url || '';
    this.name = options.name || '';
    this.groupName = options.groupName || '';
    this.description = options.description || '';

}; // end ImageModel

// The ImageGallery Controller directs the UI events
// and sends the proper data along to the Models.
ImageGallery.prototype.GalleryController = {
  // TODO:
  // - Unsaved Changes Listener
  // - Ability to Rearrange Image Order
  // - Ability to Rearrange Group Order
  // - Concat the img description based on "charlimit"
  // - confirmation displays on deletes

  init: function(parentContainer, Gallery, ImageView, ImageGroupView) {
    this.gallery = Gallery;
    this.parentContainer = $(parentContainer);
    this.imageGroup = ImageGroupView;
    this.image = ImageView;

    // render the views
    this.renderAll();

    this.bindEvents();

    // init triggers that the views will fire here.
    $(this).on('hidemodal', $.proxy(this.hideModal, this));

  },

  renderAll: function() {
    var self = this;
    var imageGroups = this.gallery.getImageGroups();

    $.each(imageGroups, function(){
        var newGroupView = new self.imageGroup();
        var groupName = this.name;
        self.parentContainer.append(newGroupView.render(this));

        var newGroupNode = self.parentContainer.find('.imageGroup[name="'+groupName+'"]');

        $.each(this.images, function(){
            var newImageView = new self.image();
            this.groupName = groupName;

            newGroupNode.find('.images').append(newImageView.render(this));
        });
    });
  },

  renderImages: function(groupName) {
    var self = this;
    var groupNode = self.parentContainer.find('.imageGroup[name="'+groupName+'"]');
    var imageGroupObj = self.gallery.getImageGroup(groupName);
    groupNode.find('.images').empty();

    $.each(imageGroupObj.object.images, function(){
        var newImageView = new self.image();
        this.groupName = groupName;

        groupNode.find('.images').append(newImageView.render(this));
    });
  },

  saveImageCheck: function(buttonNode, editMode, formValues) {
    // triggered when the "save" button is clicked in the modal
    var self = this;
    var isEdit = editMode;
    var alertBox = $('#editImageModal').find('.alert');
    var getImage, getImageGroup, imageGroupName, nameInput, newImage;

    //get the values from the formValues Array
    // imageName is required, and we won't continue without it.
    nameInput = $.grep(formValues, function (val, idx) {
      return val.name == "imageName"
    });

    // clear any class states previously added to the alertbox.
    alertBox.removeClass('alert-error alert-warning').empty();

    // first check if any name has been entered.
    if (nameInput[0].value == '') {

        $('#editImageModal').find('input[name="imageName"]')
          .closest('.field').addClass('control-group error');

        alertBox.addClass('alert-error')
          .append(self.gallery.errorCodes.images['1'])
          .show(100);

    } else {
      imageGroupName = buttonNode.attr('data-groupName');
      getImageGroup = this.gallery.getImageGroup(imageGroupName);
      getImage = getImageGroup.object.getImage(nameInput[0].value);

      // if this is NOT an edit, and
      // if imageName is the same as another image in this group,
      // also throw an error and tell the user about it.
      if (isEdit == "false" && getImage != false) {
        $('#editImageModal').find('input[name="imageName"]')
          .closest('.field').addClass('control-group error');

        alertBox.addClass('alert-error')
          .append(self.gallery.errorCodes.images['2'])
          .show(100);
      }

      // it's edit mode and we found the image, hooray!
      if (isEdit == "true" && getImage != false){
        console.log("im an edit!");
        var imageSettings = self.createImageJSON(formValues);
        getImageGroup.object.editImage(getImage, imageSettings);
      }

      // we're in the clear, create a new image!
      if (isEdit == "false" && getImage == false) {
        var newImage = self.createImageJSON(formValues);
        getImageGroup.object.createImage(newImage);

        self.renderImages(imageGroupName);
        $(self).trigger('hidemodal');

      }
    }

  },

  createImageJSON: function(formValues) {
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
  },

  bindEvents: function() {
    var self = this;
    // new image modal
    $('#imageGalleryWidget').delegate('.addImage', 'click.addImage', function(){
        var groupName = $(this).attr('data-groupName');
        self.showImageModal({'groupName': groupName});
    });

    // edit image modal
    $('#imageGalleryWidget').delegate('.editImage', 'click.editImage', function(){
        var imageName = $(this).attr('data-imageName');
        var groupName = $(this).attr('data-groupName');
        var targetImage = self.gallery.getImage(imageName, groupName);
        self.showImageModal(targetImage.object);
    });

    $("body").delegate('#editImageModal .saveImage', 'click.saveImage', function(){
      var editMode = $('#editImageForm').attr('edit');
      var formValues = $('#editImageForm').serializeArray();

      self.saveImageCheck($(this), editMode, formValues);
    });
  },

  showImageModal: function(params) {
    var modalTemplate = Handlebars.templates['editImageTemplate.tmpl'];
    $('body').append(modalTemplate(params || ''));
    $('#editImageModal').modal();

    // destroy the modal when it closes.
    $('#editImageModal').on('hidden', function(){
      $(this).remove();
    }); 
  },

  hideModal: function(){
    $('#editImageModal').modal("hide");
  }


} // end GalleryController

ImageGallery.prototype.ImageGroupView = function (settings) {
  this.template = Handlebars.templates['imageGroupTemplate.tmpl'];

  this.render = function(imageGroup) {
    return this.template(imageGroup);
  }
};

ImageGallery.prototype.ImageView = function (settings) {
  this.template = Handlebars.templates['imageTemplate.tmpl'];

  this.render = function(image) {
    return this.template(image);
  }
};
