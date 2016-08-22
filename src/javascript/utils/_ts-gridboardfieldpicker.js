Ext.define('CA.techservices.gridboard.TSGridboardFieldPicker',{
    extend: 'Rally.ui.gridboard.plugin.GridBoardFieldPicker',
    alias: 'plugin.tsgridboardfieldpicker',

    /**
     * @cfg {String[]}
     * 
     * A list of fields that are defined by the admin to be defaults --
     * if this is not empty, the Default button is added to the popover.
     */
    defaultFields: [],
    
    _createPopover: function(popoverTarget) {
        this.boardFieldBlackList = _.union(this.boardFieldBlackList,
            Rally.ui.grid.FieldColumnFactory.getBlackListedFieldsForTypes(this._getModelTypes()));
        this.gridFieldBlackList = _.union(Rally.ui.grid.FieldColumnFactory.getBlackListedFieldsForTypes(this._getModelTypes()),
            this.gridFieldBlackList);
        
        var buttons = this._getButtons();
        
        this.popover = Ext.create('Rally.ui.popover.Popover', {
            target: popoverTarget,
            placement: ['bottom', 'left', 'top', 'right'],
            cls: 'field-picker-popover',
            toFront: Ext.emptyFn,
            buttonAlign: 'center',
            title: this.getTitle(),
            minButtonWidth: 50,
            listeners: {
                destroy: function () {
                    this.popover = null;
                },
                scope: this
            },
            buttons: buttons,
            items: [
                _.extend({
                    xtype: 'rallyfieldpicker',
                    cls: 'field-picker',
                    itemId: 'fieldpicker',
                    modelTypes: this._getModelTypes(),
                    alwaysExpanded: true,
                    width: 200,
                    emptyText: 'Search',
                    selectedTextLabel: 'Selected',
                    availableTextLabel: 'Available',
                    listeners: {
                        specialkey: function(field, e) {
                            if (e.getKey() === e.ESC) {
                                this.popover.close();
                            }
                        },
                        scope: this
                    }
                }, this._getPickerConfig())
            ]
        });
    },
    
    _getButtons: function() {
        var buttons = [
            {
                xtype: "rallybutton",
                text: 'Apply',
                cls: 'field-picker-apply-btn primary rly-small',
                listeners: {
                    click: function() {
                        this._onApply(this.popover);
                    },
                    scope: this
                }
            },
            {
                xtype: "rallybutton",
                text: 'Cancel',
                cls: 'field-picker-cancel-btn secondary dark rly-small',
                listeners: {
                    click: function() {
                        this.popover.close();
                    },
                    scope: this
                }
            }
        ];
        
        if ( this.defaultFields && this.defaultFields.length > 0 ) {
            
            buttons.push({
                xtype: "rallybutton",
                text: 'Defaults',
                cls: 'field-picker-cancel-btn secondary dark rly-small',
                listeners: {
                    click: function() {
                        this._setValues(this.popover,this.defaultFields);
                        //this._onApply(this.popover);
                    },
                    scope: this
                }
            });
        }
        
        return buttons;
    },
    
    _setValues: function(popover,default_fields) {
        if ( Ext.isString(default_fields) ) { default_fields = default_fields.split(',');}
        
        var picker = popover.down('rallyfieldpicker');
        if ( Ext.isEmpty(picker) ) { return; }
        
        console.log(default_fields);
        
        picker.selectedValues = Ext.create('Ext.util.MixedCollection');
//        if (picker.isExpanded) {
//            picker._onListRefresh();
//            picker._groupSelectedRecords();
//        }

        var store = picker.getStore();
        
        Ext.Array.each(store.getRange(), function(item){
            if ( Ext.Array.contains(default_fields, item.get('name') ) )  {
                picker.select(item);
            }
        });
        
        picker._onListRefresh();
        picker._groupSelectedRecords();
        
    }
});