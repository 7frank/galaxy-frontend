



import * as jquery from "jquery";

describe("A View3D is a 3d view container", function() {
    var view;




    it("can be created", function() {
        view = document.createElement("view-3d")
        jquery("body").append(view)

        expect(view).toBeDefined();
    });


    //FIXME this should not neither result in rendering problems nor have a significant performance impact

    it("can be started and stopped multiple times", function() {

      for (let i=0;i<100;i++)
          view.start()

        //find a way to measure performance impact... until then the test will fail always
        expect(true).toBe(false);

    });


    it("can be hidden and shown again", function() {

            view.hide()
            view.show()
            expect(true).toBe(true);

    });



});

