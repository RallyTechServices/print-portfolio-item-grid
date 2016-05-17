Ext.define('ExampleBulkRecordMenuItem', {
    alias: 'widget.examplebulkrecordmenuitem',
    extend: 'Rally.ui.menu.bulk.MenuItem',

    config: {
        onBeforeAction: function(){
//            console.log('onbeforeaction');
        },

        /**
         * @cfg {Function} onActionComplete a function called when the specified menu item action has completed
         * @param Rally.data.wsapi.Model[] onActionComplete.successfulRecords any successfully modified records
         * @param Rally.data.wsapi.Model[] onActionComplete.unsuccessfulRecords any records which failed to be updated
         */
        onActionComplete: function(){
            console.log('onActionComplete');
        },

        text: 'Print Cards',

        handler: function (menuItem) {
            console.log('example menu item clicked',menuItem.records);
            this._openPrintCards(menuItem.records);

        },
        predicate: function (records) {
            return _.every(records, function (record) {
                return record;
            });
        }
    },
    _openPrintCards: function(records){
        
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
    }
});