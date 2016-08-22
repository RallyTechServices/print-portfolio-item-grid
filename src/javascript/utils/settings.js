(function () {
    var Ext = window.Ext4 || window.Ext;

    var getHiddenFieldConfig = function (name) {
        return {
            name: name,
            xtype: 'rallytextfield',
            hidden: true,
            handlesEvents: {
                typeselected: function (type) {
                    this.setValue(null);
                }
            }
        };
    };

    Ext.define('Rally.technicalservices.PortfolioItemGridSettings', {
        singleton: true,
        requires: [
            'Rally.ui.combobox.FieldComboBox',
            'Rally.ui.combobox.ComboBox',
            'Rally.ui.CheckboxField'
        ],

        getFields: function (context, settings) {
            var type_filters = Rally.data.wsapi.Filter.or([
                {property: 'TypePath', value: 'HierarchicalRequirement'},
                // {property: 'TypePath', operator: 'contains', value: 'PortfolioItem/'},
                {property: 'TypePath', value: 'Defect'}
            ]);
            var filters = [{property: 'TypePath', operator: 'contains', value: 'PortfolioItem/'}];
            return [
                // {
                //     name: 'showScopeSelector',
                //     xtype: 'rallycheckboxfield',
                //     fieldLabel: 'Show Scope Selector',
                //     bubbleEvents: ['change']
                // },
                {
                    name: 'selectorType',
                    xtype: 'rallycombobox',
                    allowBlank: false,
                    autoSelect: false,
                    shouldRespondToScopeChange: true,
                    fieldLabel: 'Selector Type',
                    context: context,
                    storeConfig: {
                        model: Ext.identityFn('TypeDefinition'),
                        sorters: [{ property: 'DisplayName' }],
                        fetch: ['DisplayName', 'ElementName', 'TypePath', 'Parent', 'UserListable'],
                        filters: filters,
                        autoLoad: false,
                        remoteSort: false,
                        remoteFilter: true
                    },
                    displayField: 'DisplayName',
                    valueField: 'TypePath',
                    readyEvent: 'ready'
                    // ,
                    // handlesEvents: {
                    //     change: function(chk){
                    //         this.setDisabled(chk.getValue()!==true);
                    //     }
                    // }
                },
                
                 {
                     xtype: 'rallyfieldpicker',
                     name: 'defaultColumnNames',
                     fieldLabel: 'Default Columns',
                     autoExpand: true,
                     modelTypes: ['Defect','HierarchicalRequirement'],
                     alwaysSelectedValues: ['FormattedID','DragAndDropRank','Rank','Name'],
                     fieldBlackList: ['ChangeSets','Defects','Tasks','Attachments','Children',
                        'Dependencies','Predecessors','Successors','Duplicates','Milestones',
                        'ObjectUUID','ObjectID','RevisionHistory','ScheduleStatePrefix',
                        'Subscription','TestCases','VersionId','Workspace'],
                     handlesEvents: {
                         typeselected: function(cb){
                             this.refreshWithNewModelTypes([cb]);
                         }
                     }
                 },
                { type: 'query' },
                {
                    name: 'showControls',
                    xtype: 'rallycheckboxfield',
                    fieldLabel: 'Show Control Bar'
                },
               // getHiddenFieldConfig('columnNames'),
                getHiddenFieldConfig('order')
            ];
        }
    });
})();