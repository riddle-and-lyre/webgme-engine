"use strict";

define(['./../../../common/LogManager.js',
    './../../../common/EventDispatcher.js',
    './../util.js',
    './WidgetBase.js'], function (logManager,
                                                   EventDispatcher,
                                                   util,
                                                   WidgetBase) {

    //load its own CSS file (css/ModelEditorSVGWidget.css)
    //util.loadCSS('css/ModelEditorModelWidget.css');

    var ModelEditorModelWidget = function () {
        var logger;

        $.extend(this, new WidgetBase());

        //get logger instance for this component
        logger = logManager.create("ModelEditorModelWidget");
    };

    return ModelEditorModelWidget;
});