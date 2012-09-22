describe("Image Gallery", function (){
  var sampleData = {
        "imageGroups": [
            {
              "name": "Test One",
              "description": "a test image group!",
              "images": [
                {
                  "name": "A Fluffy Bunny",
                  "description": "It's a bunny, what do you want?",
                  "url": "bunny.gif"
                },
                {
                  "name": "A Fluffy Kitty",
                  "description": "It's a kitty, meow!",
                  "url": "kitty.gif"
                }
              ]
            }
        ]
      };
  var ig, gallery, imageGroup;

  beforeEach(function(){
    // add in the only dom element not included in the templates.
    $('#jasmine_content').append('<input id="imageGalleryData" value="" />');

    ig = new ImageGallery(sampleData);
    gallery = ig.Gallery;
    imageGroup = gallery.imageGroups[0];

  });

  afterEach(function(){
    $('#jasmine_content').empty();
  });

  it("On Init, add Groups fron JSON", function() {
      expect(gallery.imageGroups[0].name).toEqual("Test One");
      expect(gallery.imageGroups.length).toEqual(1);
      expect(typeof gallery.imageGroups[0]).toEqual("object");
  });

  it("On Init, add Images to Group.", function(){
      expect(gallery.imageGroups[0].images[0].name)
        .toEqual("A Fluffy Bunny");
  });

  it("Test Delete Image from a Group", function(){
    
      imageGroup.deleteImage(imageGroup.images[0]);

      expect(imageGroup.images.length).toEqual(1);
      expect(imageGroup.images[0].name).toEqual("A Fluffy Kitty");
  });

  it("Test Delete ImageGroup from Gallery", function(){

      gallery.deleteGroup(imageGroup);

      expect(gallery.imageGroups.length).toEqual(0);
  });

  it("Saves back to JSON - parseGalleryData", function(){
    var parsedJSON = gallery.parseGalleryData();

    expect(parsedJSON).toEqual(sampleData);
  });

  it("Edit existing ImageGroup with CreateGroup", function(){
    var newGroupItem = {
              "name": "Test One",
              "description": "a test image group that is edited",
              "images": [
                {
                  "name": "A Fluffy Rabbit",
                  "description": "It's a bunny, what do you want?",
                  "url": "rabbit.gif"
                },
                {
                  "name": "A Fluffy Puppy",
                  "description": "It's a doggy!",
                  "url": "puppy.gif"
                }
              ]
            }
    gallery.createGroup(newGroupItem);

    expect(gallery.imageGroups.length).toEqual(1);
    expect(gallery.imageGroups[0].description)
      .toEqual("a test image group that is edited");
    expect(gallery.imageGroups[0].images[0].name)
      .toEqual("A Fluffy Rabbit");
  });

  it("Create Image Error: Name already exists", function(){
    var newImage = {
      "name": "A Fluffy Bunny"
    };
    var imageGroupObj = gallery.getImageGroup(imageGroup.name);
    imageGroupObj = imageGroupObj.object
    var imageObject = imageGroupObj.createImage(newImage);

    expect(imageObject)
      .toEqual({
        "error": 2
      });

  });

  it("Create Image Error: No name given", function(){
    var newImage = {
      "name": ""
    };
    var imageGroupObj = gallery.getImageGroup(imageGroup.name);
    imageGroupObj = imageGroupObj.object
    var imageObject = imageGroupObj.createImage(newImage);

    expect(imageObject)
      .toEqual({
        "error": 1
      });

  });


  it("Create Image Success", function(){
    var newImage = {
      "name": "A Moo Cow",
      "description": "It's a cow",
      "url": "cow.gif"
    };

    var imageGroupObj = gallery.getImageGroup(imageGroup.name);
    imageGroupObj = imageGroupObj.object
    var imageObject = imageGroupObj.createImage(newImage);

    expect(imageObject.index)
      .toEqual(2);

  });

  it("Edit Image Success", function(){
    var formSubmit = {
      "name": "A Fluffy Rabbit",
      "description": "It noms on carrots.",
      "url": "nugget.jpg"
    };

    var imageGroupObj = gallery.getImageGroup(imageGroup.name);
    imageGroupObj = imageGroupObj.object
    var oldImage = imageGroupObj.getImage(imageGroupObj.images[0].name);

    imageGroupObj.editImage(oldImage.object, formSubmit);
    var oldImageName = imageGroupObj.getImage("A Fluffy Bunny");
    var newImageName = imageGroupObj.getImage("A Fluffy Rabbit");
    expect(oldImageName).toEqual(false);
    expect(newImageName.object.name).toEqual("A Fluffy Rabbit");


  });

  it("DataSaver updates on Image Changes", function(){
    // create a new image
    var newImage = {
      "name": "A Moo Cow",
      "description": "It's a cow",
      "url": "cow.gif"
    };

    var imageGroupObj = gallery.getImageGroup(imageGroup.name);
    imageGroupObj = imageGroupObj.object
    var imageObject = imageGroupObj.createImage(newImage);

    var parsedJSON = JSON.stringify(gallery.parseGalleryData());
    var inputValue = $('#imageGalleryData').attr('value');

    expect(inputValue).toEqual(parsedJSON);
  });


}); // end describe
