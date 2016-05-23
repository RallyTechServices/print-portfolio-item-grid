Ext.define("PPIC", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    config: {
        defaultSettings: {
            showScopeSelector: true,
            selectorType: null,
            columnNames: ['FormattedID','Name'],
            showControls: true
        }
    },

    disallowedAddNewTypes: ['user', 'userprofile', 'useriterationcapacity', 'testcaseresult', 'task', 'scmrepository', 'project', 'changeset', 'change', 'builddefinition', 'build', 'program'],
    orderedAllowedPageSizes: [10, 25, 50, 100, 200],

    launch: function() {
        Rally.technicalservices.WsapiToolbox.fetchPortfolioItemTypes().then({
            success: function(portfolioItemTypes){
                this.portfolioItemTypes = portfolioItemTypes;
                this.addComponents();
            },
            failure: function(msg){
                this.logger.log('failed to load Portfolio Item Types', msg);
                Rally.ui.notify.Notifier.showError({message: msg});
            },
            scope: this
        });
    },
    gHeader: function(){
        this.logger.log('getHeader');
        return this.headerContainer;
    },
    getBody: function(){
        return this.displayContainer;
    },
    getGridboard: function(){
        return this.gridboard;
    },
    getModelNames: function(){
        return ['userstory','defect'];
//        var models = this.getSetting('type') || [];
//        if (!(models instanceof Array)){
//            models = models.split(',');
//        }
//        return models;  
    },
    addComponents: function(){
        this.logger.log('addComponents',this.portfolioItemTypes);

        this.removeAll();

        this.headerContainer = this.add({xtype:'container',itemId:'header-ct', layout: {type: 'hbox'}});
        this.displayContainer = this.add({xtype:'container',itemId:'body-ct', tpl: '<tpl>{message}</tpl>'});

        this.headerContainer.add({
            xtype: 'portfolioitemselector',
            context: this.getContext(),
            type: this.getSetting('selectorType'),
            stateful: false,
            stateId: this.getContext().getScopedStateId('app-selector'),
            width: '75%',
            fieldLabel: 'Descendants of',
            listeners: {
                change: this.updatePortfolioItem,
                scope: this
            }
        });
        
    },
    updateDashboardFilter: function(dashboardSettings){
        this.logger.log('updateDashboardFilter', dashboardSettings);

        this.getBody().removeAll();
        this.dashboardFilter = Rally.data.wsapi.Filter.fromQueryString(dashboardSettings.getFilterString());
        this.loadGridBoard();

    },
    updatePortfolioItem: function(portfolioItemRecord){
        this.logger.log('updatePortfolioItem', portfolioItemRecord);

        this.getBody().removeAll();
        this.portfolioItem = portfolioItemRecord;
        this.loadGridBoard();

    },
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        Ext.apply(this, settings);
        this.addComponents();
    },
    getSettingsFields: function() {
       return Rally.technicalservices.PortfolioItemGridSettings.getFields(this.getContext(), this.getSettings() || this.config.defaultSettings);
    },
    loadGridBoard: function(){
        this.logger.log('loadGridBoard', this.getModelNames())
        this.enableAddNew = this._shouldEnableAddNew();
        this.enableRanking = this._shouldEnableRanking();

        Rally.data.ModelFactory.getModels({
            context: this.getContext(),
            types: this.getModelNames(),
            requester: this
        }).then({
            success: function (models) {
                this.models = _.transform(models, function (result, value) {
                    result.push(value);
                }, []);

                this.modelNames = _.keys(models);
                Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
                    autoLoad: false,
                    childPageSizeEnabled: true,
                    context: this.getContext().getDataContext(),
                    enableHierarchy: false,
                    fetch: this.columns, //this.columnNames,
                    models: this.getModelNames(),//_.clone(this.models),
                    pageSize: 25,
                    remoteSort: true,
                    filters: this.getPermanentFilters(),
                    root: {expanded: true}
                }).then({
                    success: this.addGridBoard,
                    scope: this
                });
            },
            scope: this
        });

    },
    getPermanentFilters: function () {
        var filters = this._getQueryFilter().concat(this._getPortfolioItemFilter());
        
        this.logger.log('getPermanentFilters', filters.toString());
        return filters;
    },
    _getQueryFilter: function () {
        var query = new Ext.Template(this.getSetting('query')).apply({
            projectName: this.getContext().getProject().Name,
            projectOid: this.getContext().getProject().ObjectID,
            user: this.getContext().getUser()._ref
        });
        var filter = [];
        if (query) {
            try {
                filter =  [ Rally.data.wsapi.Filter.fromQueryString(query) ];
            } catch(e) {
                Rally.ui.notify.Notifier.showError({ message: e.message });
                return filter;
            }
        }
        console.log('model for filters >>>',this.models);
        var invalidQueryFilters = this._findInvalidSubFilters(filter, this.models);
        console.log('invalidQueryFilters >>>',invalidQueryFilters);

        if (invalidQueryFilters.length) {
            filter = [];
            var msg = _.map(invalidQueryFilters, function (filter) {
                return 'Could not find the attribute "'+ filter.property.split('.')[0] +'" on type "'+ this.models[0].displayName +'" in the query segment "'+ filter.toString() + '"'
            }, this);

                Rally.ui.notify.Notifier.showError({message: "Query is invalid:  " + msg });
        }
        return filter;
    },
    _propertyBelongsToSomeType: function(property, models){
        return _.some(models, function(model) {
            var field = model.getField(property) || model.getField(Ext.String.capitalize(property || ''));
            return field && !field.virtual;
        });
    },
    _findInvalidSubFilters: function(filters, models){
        return _(filters).map(this._getSubFilters, this).flatten().filter(function (subFilter) {
            return !this._propertyBelongsToSomeType(subFilter.property.split('.')[0], models);
        }, this).map(function (filter) {
            return Ext.create('Rally.data.wsapi.Filter', filter);
        }, this).value();
    },
    _getSubFilters: function(filter){
        var subFilters = [];
        var filterTraversal = function(filter) {
            if (_.isString(filter.property) && !_.contains(subFilters, filter.property) && filter.property !== 'TypeDefOid') {
                subFilters.push(filter);
            } else {
                if (_.isObject(filter.property)) {
                    filterTraversal(filter.property);
                }
                if (_.isObject(filter.value)) {
                    filterTraversal(filter.value);
                }
            }
        };

        filterTraversal(filter);

        return subFilters;
    },
    _getPortfolioItemFilter: function(){
        this.logger.log('_getPortfolioItemFilter', this.portfolioItem)

        if (!this.portfolioItem || this.portfolioItem.get('ObjectID') == 0){
            return [];
        }
        //First verify that the selected portfolio item type is an ancestor to the selected grid type.
        var pi_types = _.map(this.portfolioItemTypes, function(pi){return pi.typePath.toLowerCase()}),
            idx = _.indexOf(pi_types, this.portfolioItem.get('_type').toLowerCase()),
            type_idx = _.indexOf(pi_types, this.getSetting('type').toLowerCase());
        this.logger.log('_getPortfolioItemFilter', type_idx, idx)
        if (type_idx < idx) {
            var properties = [];
            for (var i = type_idx; i < idx; i++) {
                if (i < 0) {
                    properties.push("PortfolioItem");
                } else {
                    properties.push('Parent');
                }
            }
            this.logger.log('_getPortfolioItemFilter', properties);
            return Ext.create('Rally.data.wsapi.Filter', {
                property: properties.join('.'),
                value: this.portfolioItem.get('_ref')
            });
        } else if (type_idx === idx){
            return Ext.create('Rally.data.wsapi.Filter', {
                property: 'ObjectID',
                value: this.portfolioItem.get('ObjectID')
            });
        } else {
            Rally.ui.notify.Notifier.showError({message: "The selected type for the grid results is an ancestor to the selected portfolio item."});
            return [{property: 'ObjectID', value: 0}];
        }
        return [];
    },
    
    addGridBoard: function (store) {
        if (this.getGridboard()) {
            this.getGridboard().destroy();
        }
        //var modelNames =  ['userstory','defect'],
        var modelNames =  this.getModelNames(), //_.clone(this.modelNames),
            context = this.getContext(),
            columns = this._getColumns(),
            filters = this.getPermanentFilters();
                
        var gridboard = Ext.create('Rally.ui.gridboard.GridBoard', {
            itemId: 'gridboard',
            toggleState: 'grid',
            store: store,
            context: this.getContext(),
            plugins:[
            {
                ptype: 'rallygridboardfieldpicker',
                headerPosition: 'left',
                margin: '3 0 0 10'
            }
            ,
            {
                 ptype: 'rallygridboardinlinefiltercontrol',
                 inlineFilterButtonConfig: {
                     modelNames: modelNames,
                     inlineFilterPanelConfig: {
                         collapsed: false,
                         quickFilterPanelConfig: {
                             fieldNames: ['Owner', 'ScheduleState']
                         }
                     }
                 }
             }

            // ,
            // {
            //         ptype: 'rallygridboardcustomfiltercontrol',
            //         filterControlConfig: {
            //             modelNames: modelNames,//['HierarchicalRequirement','Defect'],
            //             stateful: true,
            //             stateId: this.getContext().getScopedStateId('portfolio-grid-filter-2')
            //         },
            //         showOwnerFilter: true,
            //         ownerFilterControlConfig: {
            //            stateful: true,
            //            stateId: this.getContext().getScopedStateId('portfolio-owner-filter-2')
            //         }
            //     }

            ],
            storeConfig: {
                filters: filters
            }
            ,
            gridConfig: {
                // allColumnsStateful: true,
                stateful: true,
                stateId: this.getContext().getScopedStateId('portfolio-grid-grid-2'),
                state: ['columnschanged','viewready','reconfigure'],
                store: store,
                columnCfgs: this._getColumns(),
                height: this.getHeight(),
                bulkEditConfig: {
                    items: [{
                        xtype: 'examplebulkrecordmenuitem'
                    }]
                }
            }
        });

        this.gridboard = this.add(gridboard);

        if (!this.getSetting('showControls')) {
            gridboard.getHeader().hide();
        }
    },
    
    _openPrintCards: function(records){
        this.logger.log('_openPrintCards', records);
        
        var fields =[{
            dataIndex: 'Name',
            maxLength: 200,
            cls: 'card-title'
        },{
            dataIndex: 'FormattedID',
            cls: 'card-id'
        }];
//
        var win = Ext.create('Rally.technicalservices.window.PrintCards',{
            records: records,
            displayFields: fields,
            currentDocument: Ext.getDoc()
        });
        
        win.show();
        win.print();
    },

    _getAlwaysSelectedFields: function() {
        var columns = this.getSetting('columnNames') ;
                
        if ( Ext.isEmpty(columns) ) {
            return [];
        }
        
        if ( Ext.isString(columns) ) {
            return columns.split(',');
        }
        
        columns = Ext.Array.filter( columns, function(column){
            return ( column != 'FormattedID' );
        });
        
        return Ext.Array.unique( columns );
    },

    _getColumns: function() {
        return this._getAlwaysSelectedFields();
    },
    
    _shouldEnableAddNew: function() {
        return !_.contains(this.disallowedAddNewTypes, this.getSetting('type').toLowerCase());
    },

    _shouldEnableRanking: function(){
        return this.getSetting('type').toLowerCase() !== 'task';
    }
});
