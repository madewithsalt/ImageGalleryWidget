describe("Image Gallery", function (){
  var sampleSettings = {
    data: {
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
              ],
              "options": IG.Model.defaultOptions.galleries
            }
        ]
      },
        inputNode: "#imageGalleryData", 
        parentContainer: "#dummyDivContainer"
      };

  var gallery, imageGroup;

  beforeEach(function(){
      // add in the only dom element not included in the templates.
      $('#jasmine_content').append('<input id="imageGalleryData" value="" />');

      gallery = new IG.ImageGallery(sampleSettings);
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
      expect(gallery.imageGroups[0].images[0].groupName)
        .toEqual("Test One");

  });


  it("Test Delete ImageGroup from Gallery", function(){
      // it will not delete a group if only 1 exists
      gallery.deleteImageGroup(imageGroup);

      expect(gallery.imageGroups.length).toEqual(1);

      gallery.createImageGroup({"name": "Another Group"});
      // we delete the first created group, which is the
      // last in the list as we prepend new groups.
      gallery.deleteImageGroup(gallery.imageGroups[1]);

      expect(gallery.imageGroups.length).toEqual(1);
      expect(gallery.imageGroups[0].name).toEqual("Another Group");

  });

  it("Saves back to JSON - parseGalleryData", function(){

      var parsedJSON = IG.Model.jsonToString(gallery.imageGroups);
      var stringifiedSample = JSON.stringify(sampleSettings.data)

      expect(parsedJSON).toEqual(stringifiedSample);
  });

  it("Edit existing ImageGroup", function(){

      gallery.editImageGroup(gallery.imageGroups[0], "description", "a test image group that is edited");

      expect(gallery.imageGroups.length).toEqual(1);
      expect(gallery.imageGroups[0].description)
        .toEqual("a test image group that is edited");

  });

  it("Create Image Group Error: Name already exists.", function() {
    // first create a second Image Group.
    var newGroup = {
      "name": "Test Group Two",
      "description": "group two descr",
      "images": []
    };
    var newGroupNode = gallery.createImageGroup(newGroup);
    var editReturn = gallery.editImageGroup(imageGroup, "name", newGroup.name);

    // Try to edit group 1 to group 2 name
    expect(editReturn).toEqual({"error": 2});
  });

  it("Reorders Groups based on Names - moveGroup", function(){
      // add some groups
      gallery.createImageGroup({"name": "A Moo Group"}); // slot 1
      gallery.createImageGroup({"name": "A Bunny Group"}); // slot 0

      // swap slot 1 - moo, with slot 2 - test
      gallery.moveGroup("A Moo Group", "Test One");

      expect(gallery.imageGroups[2].name).toEqual("A Moo Group");
      expect(gallery.imageGroups[1].name).toEqual("Test One");
      expect(gallery.imageGroups[0].name).toEqual("A Bunny Group");

      // swap slot 2 - moo, with slot 0 - bunny
      gallery.moveGroup("A Bunny Group", "A Moo Group");

      expect(gallery.imageGroups[2].name).toEqual("A Bunny Group");

  });


  it("Reorders Images based on Names - moveImage", function(){
      // add some images so that it's not so simple.
      imageGroup.createImage({"name": "A Moo Cow", "url": "moo.jpg"}); // slot 1
      imageGroup.createImage({"name": "A Snake", "url": "eew.png"}); // slot 0

      // swap slot 2 with slot 1
      imageGroup.moveImage("A Fluffy Kitty", "A Moo Cow");

      expect(imageGroup.images[1].name).toEqual("A Fluffy Kitty");
      expect(imageGroup.images[3].name).toEqual("A Fluffy Bunny");

      imageGroup.moveImage("A Snake", "A Fluffy Bunny");

      expect(imageGroup.images[3].name).toEqual("A Snake");

  });

  it("Tests re-sorting Images with resortImages", function() {
      var imageNameArray = ["A Fluffy Kitty", "A Moo Cow", "A Fluffy Bunny", "A Snake"];
      // add some images so that it's not so simple.
      imageGroup.createImage({"name": "A Moo Cow", "url": "moo.jpg"});
      imageGroup.createImage({"name": "A Snake", "url": "eew.png"});

      imageGroup.resortImages(imageNameArray);

      expect(imageGroup.images[0].name).toEqual("A Fluffy Kitty");
      expect(imageGroup.images[1].name).toEqual("A Moo Cow");


  });

  it("Create Image Error: Name already exists", function(){

      var newImage = {
        "name": "A Fluffy Bunny",
        "url": "mybunny.jpg"
      };

      var imageGroupObj = gallery.getImageGroupByName(imageGroup.name);
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
      var imageGroupObj = gallery.getImageGroupByName(imageGroup.name);
      var imageObject = imageGroupObj.createImage(newImage);

      expect(imageObject)
        .toEqual({
          "error": 1
        });

  });


  it("Create Image Error: No URL given.", function(){

      var newImage = {
        "name": "A Fluffy Rabbit"
      };

      var imageGroupObj = gallery.getImageGroupByName(imageGroup.name);
      var imageObject = imageGroupObj.createImage(newImage);

      expect(imageObject)
        .toEqual({
          "error": 3
        });

  });

  it("Edits an Image Name", function(){
    var newValues = {
      "name": "A Fluffy Rabbit"
    };
    var targetImage = imageGroup.getImageByName("A Fluffy Bunny");
    
    imageGroup.editImage(targetImage, newValues);

    expect(imageGroup.images[0].name).toEqual("A Fluffy Rabbit");
  });

  it("Test Delete Image from a Group", function(){
   
      imageGroup.deleteImage(imageGroup.images[0]);

      expect(gallery.imageGroups[0].images.length).toEqual(1);
      expect(gallery.imageGroups[0].images[0].name).toEqual("A Fluffy Kitty");

  });

  it("Create Image Success", function(){

      var newImage = {
        "name": "A Moo Cow",
        "description": "It's a cow",
        "url": "cow.gif"
      },

      imageGroupObj = gallery.getImageGroupByName(imageGroup.name),
      imageGroupImages = imageGroupObj.images.length,
      imageObject = imageGroupObj.createImage(newImage);

      expect(imageGroupObj.images.length)
        .toEqual(imageGroupImages + 1);

      expect(imageGroupObj.images[0].name)
        .toEqual("A Moo Cow");

  });

  it("Edit Image Success", function(){
      var formSubmit = {
        "name": "A Fluffy Rabbit",
        "description": "It noms on carrots.",
        "url": "nugget.jpg"
      };

      var imageGroupObj = gallery.getImageGroupByName(imageGroup.name);
      var oldImage = imageGroupObj.getImageByName(imageGroupObj.images[0].name);

      imageGroupObj.editImage(oldImage, formSubmit);
      var oldImageName = imageGroupObj.getImageByName("A Fluffy Bunny");
      var newImageName = imageGroupObj.getImageByName("A Fluffy Rabbit");

      expect(oldImageName).toEqual(false);
      expect(newImageName.name).toEqual("A Fluffy Rabbit");


  });

  it("DataSaver updates on Image Changes", function(){
    // create a new image
    var newImage = {
      "name": "A Moo Cow",
      "description": "It's a cow",
      "url": "cow.gif"
    };

    var imageGroupObj = gallery.getImageGroupByName(imageGroup.name);
    var imageObject = imageGroupObj.createImage(newImage);

    var parsedJSON = IG.Model.jsonToString(gallery.imageGroups);
    var inputValue = $('#imageGalleryData').attr('value');

    expect(inputValue).toEqual(parsedJSON);
  });



}); // end describe
