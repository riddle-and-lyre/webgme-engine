"use strict";

// let require load all the toplevel needed script and call us on domReady
define([  'logManager',
    'commonUtil',
    'clientUtil',
    'user/basic',
    'js/ObjectBrowser/TreeBrowserControl',
    'js/ObjectBrowser/JSTreeBrowserWidget',
    'js/PartBrowser/PartBrowserView',
    'js/PartBrowser/PartBrowserControl',
    'js/Project/ProjectPanel',
    'js/Project/ProjectControl',
    'js/NetworkStatus/NetworkStatusControl',
    'js/NetworkStatus/NetworkStatusView',
    'js/Project/ProjectTitleView',
    'js/SetEditor/SetEditorView',
    'js/SetEditor/SetEditorControl',
    'js/LoggerStatus/LoggerStatus',
    'js/Repository/BranchManagerControl',
    'js/Repository/BranchManagerView',
    'js/VisualizerPanel/VisualizerPanel',
    'text!js/Visualizers.json',
    'js/PropertyEditorWidget/PropertyEditorWidget',
    'js/PropertyEditorWidget/PropertyEditorWidgetController'], function (logManager,
                                            commonUtil,
                                            util,
                                            Core,
                                            TreeBrowserControl,
                                            JSTreeBrowserWidget,
                                            PartBrowserView,
                                            PartBrowserControl,
                                            ProjectPanel,
                                            ProjectControl,
                                            NetworkStatusControl,
                                            NetworkStatusView,
                                            ProjectTitleView,
                                            SetEditorView,
                                            SetEditorControl,
                                            LoggerStatus,
                                            BranchManagerControl,
                                            BranchManagerView,
                                            VisualizerPanel,
                                            VisualizersJSON,
                                            PropertyEditorWidget,
                                            PropertyEditorWidgetController) {

    logManager.excludeComponent("CORE");
    logManager.excludeComponent('TreeBrowserControl');
    logManager.excludeComponent("Client");
    logManager.excludeComponent('PartBrowserControl');
    logManager.excludeComponent('SetEditorControl');
    logManager.excludeComponent('JSTreeBrowserWidget');
    


    var proxy = null,
        tJSTree,
        mainWidget,
        doConnect,
        lastBodyWidth = 0,
        lastBodyHeight = 0,
        resizeMiddlePane,
        mainController,
        currentNodeId = null,
        partBrowserController,
        partBrowserView,
        projectPanel,
        projectController,
        networkStatusView,
        networkStatusControl,
        projectTitleView,
        setEditorView,
        setEditorControl,
        visualizerPanel,
        visArray,
        selectedObjectChanged,
        demoHackInit,
        onOneEvent,
        branchManagerView,
        branchManagerControl,
        branchChanged,
        treeBrowserView,
        propertyEditorWidget,
        propertyEditorWidgetController;

    /*
     * Compute the size of the middle pane window based on current browser size
     */
    lastBodyWidth = 0;
    lastBodyHeight = 0;
    resizeMiddlePane = function () {
        var $body = $("body"),
            $leftPanel =  $("#leftPane"),
            $rightPanel = $("#rightPane"),
            $middlePanel = $("#middlePane"),
            $contentContainer = $("#contentContainer"),
            $header = $("#header"),
            $footer = $("#footer"),
            bodyW = $body.width(),
            bodyH = $body.height(),
            headerH = $header.height(),
            footerH = $footer.height(),
            eW = 0,
            eH = 0,
            leftPanelW = $leftPanel.outerWidth(),
            leftPanelH = $leftPanel.outerHeight(),
            rightPanelW = $rightPanel.outerWidth(),
            rightPanelH = $rightPanel.outerHeight();

        if (commonUtil.DEBUG === "DEMOHACK") {
            $leftPanel.width(1);
            $rightPanel.width(1);
            leftPanelW = 1;
            rightPanelW = 1;
        } else {
            $leftPanel.attr("style", "");
            $rightPanel.attr("style", "");
        }

        $contentContainer.height(bodyH - headerH - footerH);

        if (bodyW !== lastBodyWidth || bodyH !== lastBodyHeight) {
            $middlePanel.width(bodyW - leftPanelW - rightPanelW);

            lastBodyWidth = bodyW;
            lastBodyHeight = bodyH;

            eW = $middlePanel.width();
            eH = $middlePanel.height();

            if (visualizerPanel) {
                visualizerPanel.widgetContainerSizeChanged(eW, eH);
            }
        }
    };

    //hook up windows resize event
    $(window).resize(function () {
        resizeMiddlePane();
    });

    //and call if for the first time as well
    resizeMiddlePane();

    new LoggerStatus("panLoggerStatus");

    selectedObjectChanged = function (__project, nodeId) {
        currentNodeId = nodeId;
        if (mainController) {
            mainController.selectedObjectChanged(currentNodeId);
        }
        if (partBrowserController) {
            partBrowserController.selectedObjectChanged(currentNodeId);
        }
        if (setEditorControl) {
            setEditorControl.selectedObjectChanged(currentNodeId);
        }
        if (visualizerPanel) {
            visualizerPanel.selectedObjectChanged(currentNodeId);
        }
    };

    branchChanged = function (__project, branchName) {
        var readOnly = (branchName === null || branchName === undefined) ? true : false;

        if (projectTitleView) {
            projectTitleView.refresh(proxy);
        }

        partBrowserView.setReadOnly(readOnly);
        setEditorView.setReadOnly(readOnly);
        treeBrowserView.setReadOnly(readOnly);
        visualizerPanel.setReadOnly(readOnly);

        propertyEditorWidget.setReadOnly(readOnly);
    };

    doConnect = function (callback) {


        var options = commonUtil.combinedserver,
            i;
        if (proxy === null) {
            proxy = new Core({
                proxy: location.host + options.projsrv,
                options : options.socketiopar,
                projectinfo : "*PI*" + options.mongocollection,
                defaultproject : options.mongocollection,
                faulttolerant : options.faulttolerant,
                cache : options.cache,
                log : options.logging,
                logsrv : location.host + options.logsrv,
                nosaveddata : commonUtil.combinedserver.nosaveddata,
                project : commonUtil.combinedserver.project
            });
            proxy.addEventListener(proxy.events.SELECTEDOBJECT_CHANGED, function (__project, nodeId) {
                selectedObjectChanged(__project, nodeId);
            });
            proxy.addEventListener(proxy.events.PROJECT_OPENED, function (name) {
                if (projectTitleView) {
                    projectTitleView.refresh(proxy);
                }
            });
            proxy.addEventListener(proxy.events.PROJECT_CLOSED, function () {
                if (projectTitleView) {
                    projectTitleView.refresh(proxy);
                }
            });
            proxy.addEventListener(proxy.events.BRANCH_CHANGED, function (__project, branchName) {
                branchChanged(__project, branchName);
            });

            treeBrowserView = new JSTreeBrowserWidget("tbJSTree");
            tJSTree = new TreeBrowserControl(proxy, treeBrowserView);

            partBrowserView = new PartBrowserView("pPartBrowser");
            partBrowserController = new PartBrowserControl(proxy, partBrowserView);

            setEditorView = new SetEditorView("pSetEditor");
            setEditorControl = new SetEditorControl(proxy, setEditorView);

            projectPanel = new ProjectPanel("projectHistoryPanel");
            projectController = new ProjectControl(proxy, projectPanel);

            networkStatusView = new NetworkStatusView("panNetworkStatus");
            networkStatusControl = new NetworkStatusControl(proxy, networkStatusView);

            branchManagerView = new BranchManagerView("panBranchManager");
            branchManagerControl = new BranchManagerControl(proxy, branchManagerView);

            projectTitleView = new ProjectTitleView("projectInfoContainer");

            visualizerPanel = new VisualizerPanel({"containerElement": "visualizerPanel",
                                                   "client": proxy,
                                                   "widgetContainer": "middlePane"});

            propertyEditorWidget = new PropertyEditorWidget({"containerElement": "#rightPane"});
            propertyEditorWidgetController = new PropertyEditorWidgetController(proxy, propertyEditorWidget);

            visArray = JSON.parse(VisualizersJSON);
            visualizerPanel.addRange(visArray, function () {
                visualizerPanel.setActiveVisualizer('DesignerCanvas_Model');
            });

            //TESTING part
            if (commonUtil.DEBUG === true) {
                $('#leftPane').append("<div class=\"sidePaneWidget\"><div class=\"header\">TESTING</div><div id=\"tetingpanel\"><input id=\"testingbtn1\" value=\"test1\" type=\"button\"><input id=\"testingbtn2\" value=\"test2\" type=\"button\"><input id=\"testingbtn3\" value=\"test3\" type=\"button\"></div></div>");
                $('#testingbtn1').on('click', function (event) {
                    proxy.testMethod(1);
                });
                $('#testingbtn2').on('click', function (event) {
                    proxy.testMethod(2);
                });
                $('#testingbtn3').on('click', function (event) {
                    proxy.testMethod(3);
                });
            }
            callback(null);
        }
    };

    return {
        start : function () {
            doConnect(function (err) {});
        }
    };
});