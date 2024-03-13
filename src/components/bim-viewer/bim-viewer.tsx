import { Component, Prop, h } from '@stencil/core';
// import { Component, Prop, getAssetPath, h } from '@stencil/core';
import { Tab } from 'bootstrap/dist/js/bootstrap.esm.min.js'
import { Viewer, XKTLoaderPlugin, NavCubePlugin, TreeViewPlugin, FastNavPlugin, ContextMenu, } from "@xeokit/xeokit-sdk/dist/xeokit-sdk.min.es.js";

import { Grid, h as hg } from "gridjs";
// import { faker } from '@faker-js/faker';



@Component({
  tag: 'bim-viewer',
  styleUrl: 'bim-viewer.css',
  shadow: false,
})
export class BimViewer {


  currentViewer: Viewer = null;

  /**
  * Path of XKT file to load
  */
  @Prop() xktsrc: string;

  /**
  * Id of the canvas to render the model
  */
  @Prop() canvasid: string;

  switchTabs(id) {
    new Tab(document.getElementById(id)).show()
  }

  showModel(currentViewer: Viewer, manifestFile: string) {
    // showModel(currentViewer: Viewer, xktFile: string) {
    // console.log('Loading XKT file: ', xktFile);
    console.log('Loading manifest file: ', manifestFile);

    if (currentViewer) {
      currentViewer.destroy();
    }

    this.switchTabs('nav-tab-viewer');

    //------------------------------------------------------------------------------------------------------------------
    // Create a Viewer, arrange the camera
    //------------------------------------------------------------------------------------------------------------------

    const viewer = new Viewer({
      canvasId: this.canvasid,
      transparent: true,
      dtxEnabled: true
    });

    //const scene = viewer.scene;
    const cameraFlight = viewer.cameraFlight;
    //const camera = scene.camera;

    viewer.camera.eye = [110.27, 172.88, -6.49];
    viewer.camera.look = [33.88, 177.99, -101.79];
    viewer.camera.up = [0.02, 0.99, 0.03];

    viewer.cameraControl.followPointer = true;

    //------------------------------------------------------------------------------------------------------------------
    // Customize CameraControl
    //------------------------------------------------------------------------------------------------------------------

    const cameraControl = viewer.cameraControl;

    cameraControl.navMode = "orbit";
    cameraControl.followPointer = true;

    const pivotElement = document.createRange().createContextualFragment("<div class='xeokit-camera-pivot-marker'></div>").firstChild;
    document.body.appendChild(pivotElement);
    cameraControl.pivotElement = pivotElement;

    cameraControl.on("picked", (e) => {
      console.log("picked");
      console.log(e);
    });

    cameraControl.on("doublePicked", (e) => {
      console.log("doublePicked");
      console.log(e);
    });

    //------------------------------------------------------------------------------------------------------------------
    // Load a model and fit it to view
    //------------------------------------------------------------------------------------------------------------------

    const xktLoader = new XKTLoaderPlugin(viewer);

    //////////////////////////////////////////////

    const sceneModel = xktLoader.load({
      manifestSrc: `/owl_tutorial/static/lib/${manifestFile}`,
      // manifestSrc: "/owl_tutorial/static/lib/westside_manifest.json",
      id: "myModel",
      objectDefaults: { // This model has opaque windows / spaces; make them transparent
        "IfcPlate": {
          opacity: 0.3 // These are used as windows in this model - make transparent
        },
        "IfcWindow": {
          opacity: 0.4
        },
        "IfcSpace": {
          opacity: 0.4
        }
      }
    });

    sceneModel.on("loaded", () => {
      cameraFlight.flyTo(sceneModel);
      // viewer.cameraFlight.jumpTo(sceneModel);
    });

    new NavCubePlugin(viewer, {
      canvasId: "myNavCubeCanvas",
      visible: true,
      size: 250,
      alignment: "bottomRight",
      bottomMargin: 100,
      rightMargin: 10
    });

    new FastNavPlugin(viewer, {
      hideEdges: true,
      hideSAO: true,
      hideColorTexture: false,
      hidePBR: false,
      hideTransparentObjects: false,
      scaleCanvasResolution: false,
      scaleCanvasResolutionFactor: 0.5,
      delayBeforeRestore: true,
      delayBeforeRestoreSeconds: 0.4
    });

    new TreeViewPlugin(viewer, {
      containerElement: document.getElementById("treeViewContainer"),
      hierarchy: "types",
      autoExpandDepth: 0
    });


    //#####################################################################
    //----------------------------------------------------------------------------------------------------------------------
    // Create a tree view
    //----------------------------------------------------------------------------------------------------------------------

    const treeView = new TreeViewPlugin(viewer, {
      containerElement: document.getElementById("treeViewContainer"),
      hierarchy: "types",
      autoExpandDepth: 1
    });

    const treeViewContextMenu = new ContextMenu({

      items: [
        [
          {
            title: "View Fit",
            doAction: function (context) {
              const scene = context.viewer.scene;
              const objectIds = [];
              context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                if (treeViewNode.objectId) {
                  objectIds.push(treeViewNode.objectId);
                }
              });
              scene.setObjectsVisible(objectIds, true);
              scene.setObjectsHighlighted(objectIds, true);
              context.viewer.cameraFlight.flyTo({
                projection: "perspective",
                aabb: scene.getAABB(objectIds),
                duration: 0.5
              }, () => {
                setTimeout(function () {
                  scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
                }, 500);
              });
            }
          },
          {
            title: "View Fit All",
            doAction: function (context) {
              const scene = context.viewer.scene;
              context.viewer.cameraFlight.flyTo({
                projection: "perspective",
                aabb: scene.getAABB({}),
                duration: 0.5
              });
            }
          }
        ],
        [
          {
            title: "Hide",
            doAction: function (context) {
              context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                if (treeViewNode.objectId) {
                  const entity = context.viewer.scene.objects[treeViewNode.objectId];
                  if (entity) {
                    entity.visible = false;
                  }
                }
              });
            }
          },
          {
            title: "Hide Others",
            doAction: function (context) {
              const scene = context.viewer.scene;
              scene.setObjectsVisible(scene.visibleObjectIds, false);
              scene.setObjectsXRayed(scene.xrayedObjectIds, false);
              scene.setObjectsSelected(scene.selectedObjectIds, false);
              scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
              context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                if (treeViewNode.objectId) {
                  const entity = scene.objects[treeViewNode.objectId];
                  if (entity) {
                    entity.visible = true;
                  }
                }
              });
            }
          },
          {
            title: "Hide All",
            getEnabled: function (context) {
              return (context.viewer.scene.visibleObjectIds.length > 0);
            },
            doAction: function (context) {
              context.viewer.scene.setObjectsVisible(context.viewer.scene.visibleObjectIds, false);
            }
          }
        ],
        [
          {
            title: "Show",
            doAction: function (context) {
              context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                if (treeViewNode.objectId) {
                  const entity = context.viewer.scene.objects[treeViewNode.objectId];
                  if (entity) {
                    entity.visible = true;
                    entity.xrayed = false;
                    entity.selected = false;
                  }
                }
              });
            }
          },
          {
            title: "Show Others",
            doAction: function (context) {
              const scene = context.viewer.scene;
              scene.setObjectsVisible(scene.objectIds, true);
              scene.setObjectsXRayed(scene.xrayedObjectIds, false);
              scene.setObjectsSelected(scene.selectedObjectIds, false);
              context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                if (treeViewNode.objectId) {
                  const entity = scene.objects[treeViewNode.objectId];
                  if (entity) {
                    entity.visible = false;
                  }
                }
              });
            }
          },
          {
            title: "Show All",
            getEnabled: function (context) {
              const scene = context.viewer.scene;
              return (scene.numVisibleObjects < scene.numObjects);
            },
            doAction: function (context) {
              const scene = context.viewer.scene;
              scene.setObjectsVisible(scene.objectIds, true);
              scene.setObjectsXRayed(scene.xrayedObjectIds, false);
              scene.setObjectsSelected(scene.selectedObjectIds, false);
            }
          }
        ],
        [
          {
            title: "X-Ray",
            doAction: function (context) {
              context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                if (treeViewNode.objectId) {
                  const entity = context.viewer.scene.objects[treeViewNode.objectId];
                  if (entity) {
                    entity.xrayed = true;
                    entity.visible = true;
                  }
                }
              });
            }
          },
          {
            title: "Undo X-Ray",
            doAction: function (context) {
              context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                if (treeViewNode.objectId) {
                  const entity = context.viewer.scene.objects[treeViewNode.objectId];
                  if (entity) {
                    entity.xrayed = false;
                  }
                }
              });
            }
          },
          {
            title: "X-Ray Others",
            doAction: function (context) {
              const scene = context.viewer.scene;
              scene.setObjectsVisible(scene.objectIds, true);
              scene.setObjectsXRayed(scene.objectIds, true);
              scene.setObjectsSelected(scene.selectedObjectIds, false);
              scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
              context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                if (treeViewNode.objectId) {
                  const entity = scene.objects[treeViewNode.objectId];
                  if (entity) {
                    entity.xrayed = false;
                  }
                }
              });
            }
          },
          {
            title: "Reset X-Ray",
            getEnabled: function (context) {
              return (context.viewer.scene.numXRayedObjects > 0);
            },
            doAction: function (context) {
              context.viewer.scene.setObjectsXRayed(context.viewer.scene.xrayedObjectIds, false);
            }
          }
        ],
        [
          {
            title: "Select",
            doAction: function (context) {
              context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                if (treeViewNode.objectId) {
                  const entity = context.viewer.scene.objects[treeViewNode.objectId];
                  if (entity) {
                    entity.selected = true;
                    entity.visible = true;
                  }
                }
              });
            }
          },
          {
            title: "Deselect",
            doAction: function (context) {
              context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                if (treeViewNode.objectId) {
                  const entity = context.viewer.scene.objects[treeViewNode.objectId];
                  if (entity) {
                    entity.selected = false;
                  }
                }
              });
            }
          },
          {
            title: "Clear Selection",
            getEnabled: function (context) {
              return (context.viewer.scene.numSelectedObjects > 0);
            },
            doAction: function (context) {
              context.viewer.scene.setObjectsSelected(context.viewer.scene.selectedObjectIds, false);
            }
          }
        ]
      ]
    });

    // Right-clicking on a tree node shows the context menu for that node

    treeView.on("contextmenu", (e) => {

      treeViewContextMenu.context = { // Must set context before opening menu
        viewer: e.viewer,
        treeViewPlugin: e.treeViewPlugin,
        treeViewNode: e.treeViewNode,
        entity: e.viewer.scene.objects[e.treeViewNode.objectId] // Only defined if tree node is a leaf node
      };

      treeViewContextMenu.show(e.event.pageX, e.event.pageY);
    });

    // Left-clicking on a tree node isolates that object in the 3D view

    treeView.on("nodeTitleClicked", (e) => {
      const scene = viewer.scene;
      const objectIds = [];
      e.treeViewPlugin.withNodeTree(e.treeViewNode, (treeViewNode) => {
        if (treeViewNode.objectId) {
          objectIds.push(treeViewNode.objectId);
        }
      });
      e.treeViewPlugin.unShowNode();
      scene.setObjectsXRayed(scene.objectIds, true);
      scene.setObjectsVisible(scene.objectIds, true);
      scene.setObjectsXRayed(objectIds, false);
      viewer.cameraFlight.flyTo({
        aabb: scene.getAABB(objectIds),
        duration: 0.5
      }, () => {
        setTimeout(function () {
          scene.setObjectsVisible(scene.xrayedObjectIds, false);
          scene.setObjectsXRayed(scene.xrayedObjectIds, false);
        }, 500);
      });
    });

    //------------------------------------------------------------------------------------------------------------------
    // Create two ContextMenus - one for right-click on empty space, the other for right-click on an Entity
    //------------------------------------------------------------------------------------------------------------------

    const canvasContextMenu = new ContextMenu({
      enabled: true,
      context: {
        viewer: viewer
      },
      items: [
        [
          {
            title: "Hide All",
            getEnabled: function (context) {
              return (context.viewer.scene.numVisibleObjects > 0);
            },
            doAction: function (context) {
              context.viewer.scene.setObjectsVisible(context.viewer.scene.visibleObjectIds, false);
            }
          },
          {
            title: "Show All",
            getEnabled: function (context) {
              const scene = context.viewer.scene;
              return (scene.numVisibleObjects < scene.numObjects);
            },
            doAction: function (context) {
              const scene = context.viewer.scene;
              scene.setObjectsVisible(scene.objectIds, true);
              scene.setObjectsXRayed(scene.xrayedObjectIds, false);
              scene.setObjectsSelected(scene.selectedObjectIds, false);
            }
          }
        ],
        [
          {
            title: "View Fit All",
            doAction: function (context) {
              context.viewer.cameraFlight.flyTo({
                aabb: context.viewer.scene.getAABB()
              });
            }
          }
        ]
      ]
    });

    const objectContextMenu = new ContextMenu({
      items: [
        [
          {
            title: "View Fit",
            doAction: function (context) {
              const viewer = context.viewer;
              const scene = viewer.scene;
              const entity = context.entity;
              viewer.cameraFlight.flyTo({
                aabb: entity.aabb,
                duration: 0.5
              }, () => {
                setTimeout(function () {
                  scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
                }, 500);
              });
            }
          },
          {
            title: "View Fit All",
            doAction: function (context) {
              const scene = context.viewer.scene;
              context.viewer.cameraFlight.flyTo({
                projection: "perspective",
                aabb: scene.getAABB(),
                duration: 0.5
              });
            }
          },
          {
            title: "Show in Tree",
            doAction: function (context) {
              const objectId = context.entity.id;
              context.treeViewPlugin.showNode(objectId);
            }
          }
        ],
        [
          {
            title: "Hide",
            getEnabled: function (context) {
              return context.entity.visible;
            },
            doAction: function (context) {
              context.entity.visible = false;
            }
          },
          {
            title: "Hide Others",
            doAction: function (context) {
              const viewer = context.viewer;
              const scene = viewer.scene;
              const entity = context.entity;
              const metaObject = viewer.metaScene.metaObjects[entity.id];
              if (!metaObject) {
                return;
              }
              scene.setObjectsVisible(scene.visibleObjectIds, false);
              scene.setObjectsXRayed(scene.xrayedObjectIds, false);
              scene.setObjectsSelected(scene.selectedObjectIds, false);
              scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
              metaObject.withMetaObjectsInSubtree((metaObject) => {
                const entity = scene.objects[metaObject.id];
                if (entity) {
                  entity.visible = true;
                }
              });
            }
          },
          {
            title: "Hide All",
            getEnabled: function (context) {
              return (context.viewer.scene.numVisibleObjects > 0);
            },
            doAction: function (context) {
              context.viewer.scene.setObjectsVisible(context.viewer.scene.visibleObjectIds, false);
            }
          },
          {
            title: "Show All",
            getEnabled: function (context) {
              const scene = context.viewer.scene;
              return (scene.numVisibleObjects < scene.numObjects);
            },
            doAction: function (context) {
              const scene = context.viewer.scene;
              scene.setObjectsVisible(scene.objectIds, true);
            }
          }
        ],
        [
          {
            title: "X-Ray",
            getEnabled: function (context) {
              return (!context.entity.xrayed);
            },
            doAction: function (context) {
              context.entity.xrayed = true;
            }
          },
          {
            title: "Undo X-Ray",
            getEnabled: function (context) {
              return context.entity.xrayed;
            },
            doAction: function (context) {
              context.entity.xrayed = false;
            }
          },
          {
            title: "X-Ray Others",
            doAction: function (context) {
              const viewer = context.viewer;
              const scene = viewer.scene;
              const entity = context.entity;
              const metaObject = viewer.metaScene.metaObjects[entity.id];
              if (!metaObject) {
                return;
              }
              scene.setObjectsVisible(scene.objectIds, true);
              scene.setObjectsXRayed(scene.objectIds, true);
              scene.setObjectsSelected(scene.selectedObjectIds, false);
              scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
              metaObject.withMetaObjectsInSubtree((metaObject) => {
                const entity = scene.objects[metaObject.id];
                if (entity) {
                  entity.xrayed = false;
                }
              });
            }
          },
          {
            title: "Reset X-Ray",
            getEnabled: function (context) {
              return (context.viewer.scene.numXRayedObjects > 0);
            },
            doAction: function (context) {
              context.viewer.scene.setObjectsXRayed(context.viewer.scene.xrayedObjectIds, false);
            }
          }
        ],
        [
          {
            title: "Select",
            getEnabled: function (context) {
              return (!context.entity.selected);
            },
            doAction: function (context) {
              context.entity.selected = true;
            }
          },
          {
            title: "Undo select",
            getEnabled: function (context) {
              return context.entity.selected;
            },
            doAction: function (context) {
              context.entity.selected = false;
            }
          },
          {
            title: "Clear Selection",
            getEnabled: function (context) {
              return (context.viewer.scene.numSelectedObjects > 0);
            },
            doAction: function (context) {
              context.viewer.scene.setObjectsSelected(context.viewer.scene.selectedObjectIds, false);
            }
          }
        ]
      ],
      enabled: true
    });

    viewer.cameraControl.on("rightClick", function (e) {
      var hit = viewer.scene.pick({
        canvasPos: e.canvasPos
      });
      if (hit && hit.entity.isObject) {
        objectContextMenu.context = { // Must set context before showing menu
          viewer: viewer,
          treeViewPlugin: treeView,
          entity: hit.entity
        };
        objectContextMenu.show(e.pagePos[0], e.pagePos[1]);
      } else {
        canvasContextMenu.context = { // Must set context before showing menu
          viewer: viewer
        };
        canvasContextMenu.show(e.pagePos[0], e.pagePos[1]);
      }
      e.event.preventDefault();
    });

    //???????? window.viewer = viewer;

    //#####################################################################


    //////////////////////////////////////////////


    // const xktPath = "/owl_tutorial/static/lib/" + xktFile + ".xkt";
    // xktLoader.load({
    //   // src: this.xktsrc,
    //   src: xktPath,
    //   edges: true
    // });
    return viewer;
  }



  componentWillLoad() {
    console.log('Stencil: componentWillLoad');

  }

  componentDidLoad() {


    console.log('Stencil: componentDidLoad');
    console.log("xktsrc: ", this.xktsrc);

    new Grid({
      columns: [
        {
          name: 'Actions',
          formatter: (_, row) => {

            return hg('button', {
              className: 'btn btn-primary',
              //              className: 'py-2 mb-4 px-4 border rounded-md text-white bg-blue-600',
              onClick: () => this.currentViewer = this.showModel(this.currentViewer, `${row.cells[2].data}`)
            }, 'View');
          }
        },
        "id",
        "projectId",
        "xktFile",
        "author",
        "createdAt",
        "schema",
        "creatingApplication"
      ],
      // pagination: { limit: 1 },
      pagination: true,
      search: true,
      sort: true,
      resizable: true,

      data: [
        // ["0001", "1xS3BCk291UvhgP2a6eflL", "Duplex_A_20110907", "", "2011-09-07T12:28:29", "IFC2X3", "20100326_1700"],
        ["Westside River Hospital", "248gkaFu11TgGGHnEQdH2Q", "westside/westside_manifest.json", "", "2020-08-14T15:25:07", "IFC4", "20180328_1600(x64) - Exporter 19.0.1.1 - Alternate UI 19.0.1.1"],
        ["OTC Conference Center", "3lMSBJ1J9AUQZulZKiGsht", "otc/OTC_manifest.json", "", "2016-01-24T17:43:58", "IFC2X3", "20150702_1515(x64) - Exporter 15.5.0.0 - Alternate UI 15.5.0.0"],
        ["Clinic", "3lMSBJ1J9AUQZulZKiGsht", "clinic/clinic_manifest.json", "architect", "2015-08-27T14:54:09", "IFC2X3", "IFC file generated by Graphisoft ArchiCAD-64 18.0.0 NED FULL Windows version (IFC2x3 add-on version: 6000 NED FULL)."],
        ["10 Appartementen Schependomlaan", "3lMSBJ1J9AUQZulZKiGsht", "schependomlaan/schependoomlaan_manifest.json", "architect", "2015-08-27T14:54:09", "IFC2X3", "IFC file generated by Graphisoft ArchiCAD-64 18.0.0 NED FULL Windows version (IFC2x3 add-on version: 6000 NED FULL)."],
      ],

    }).render(document.getElementById("grid")); // this is the render method from Grid.js

  }

  render() { // this is the render method from the component
    console.log('canvasid: ', this.canvasid);

    return (
      <div class="fullsize">

        {/* <div class="p-4">
          <div class="nav nav-tabs" id="nav-tab" role="tablist">
            <button class="nav-link active" id="nav-tab-project" data-bs-toggle="tab" data-bs-target="#tabs-1" type="button" role="tab" aria-controls="tabs-1" aria-selected="true">Projects </button>
            <button class="nav-link" id="nav-tab-viewer" data-bs-toggle="tab" data-bs-target="#tabs-2" type="button" role="tab" aria-controls="tabs-2" aria-selected="false">Viewer </button>
          </div>
          <div class="tab-content" id="myTabContent">
            <div class="tab-pane fade show active" id="tabs-1" role="tabpanel" aria-labelledby="tabs-tab1">
              <h3>Select Project</h3>
              <div class="fullsize" id="grid"></div>
              <div class="tab-pane fade" id="tabs-2" role="tabpanel" aria-labelledby="tabs-2">
                Viewer

                <h3>Viewer</h3>
              </div>
            </div>
          </div>
        </div> */}

        {/* <div class="p-4">
          <div class="nav nav-tabs" id="nav-tab" role="tablist">
            <button class="nav-link active" id="nav-tabs-proj" data-bs-toggle="tab" data-bs-target="#tabs-proj" type="button" role="tab" aria-controls="tabs-proj" aria-selected="true">proj </button>
            <button class="nav-link" id="nav-tab-vie" data-bs-toggle="tab" data-bs-target="#tabs-2" type="button" role="tab" aria-controls="tabs-vie" aria-selected="false">vie </button>
          </div>
          <div class="tab-content" id="myTabContent">
            <div class="tab-pane fade show active" id="tabs-proj" role="tabpanel" aria-labelledby="tabs-proj">
              xxx Projects
              <div class="fullsize" id="grid"></div>
            </div>
            <div class="tab-pane fade" id="tabs-vie" role="tabpanel" aria-labelledby="tabs-vie">
              xxx Views
              <canvas class="bimcanvas" id={this.canvasid}></canvas>
              <canvas id="myNavCubeCanvas"></canvas>
              <div id="stats">
              </div>
              <div id="treeViewContainer"></div>

            </div>
          </div>
        </div> */}


        <nav>

          <div class="nav nav-tabs" id="nav-tab" role="tablist">
            <button class="nav-link active" id="nav-tabs-projects" data-bs-toggle="tab" data-bs-target="#tabs-projects" type="button" role="tab" aria-controls="tabs-projects" aria-selected="true">Projects
            </button>
            <button class="nav-link" id="nav-tab-viewer" data-bs-toggle="tab" data-bs-target="#tabs-viewer" type="button" role="tab" aria-controls="tabs-viewer" aria-selected="false">Viewer
            </button>
          </div>
        </nav>


        <div class="tab-content" id="myTabContent">
          <div class="tab-pane fade show active" id="tabs-projects" role="tabpanel" aria-labelledby="tabs-projects">
            PROJECTS
            <div class="fullsize" id="grid"></div>
          </div>
          <div class="tab-pane fade" id="tabs-viewer" role="tabpanel" aria-labelledby="tabs-viewer">
            VIEWER
            <canvas class="bimcanvas" id={this.canvasid}></canvas>
            <canvas id="myNavCubeCanvas"></canvas>
            <div id="stats">
            </div>
            <div id="treeViewContainer"></div>
          </div>
        </div>



      </div>






    );
  }



} 
