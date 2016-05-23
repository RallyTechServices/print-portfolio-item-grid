Ext.define('Rally.technicalservices.PortfolioParentComboBox',{
    extend: 'Rally.ui.combobox.FieldValueComboBox',
    _loadStoreValues: function() {
        this.field.getAllowedValueStore().load({
            requester: this,
            callback: function(records, operation, success) {
                var store = this.store;
                if (!store) {
                    return;
                }
                var noEntryValues = [],
                    labelValues = _.map(
                        _.filter(records, this._hasStringValue),
                        this._convertAllowedValueToLabelValuePair,
                        this
                    );

                if(this.field.getType() === 'boolean') {
                    labelValues = labelValues.concat([
                        this._convertToLabelValuePair('Yes', true),
                        this._convertToLabelValuePair('No', false)
                    ]);
                } else if (this.field.required === false) {
                    var name = "-- No Entry --",
                        value = "";
                    if (this.getUseNullForNoEntryValue()) {
                        value = null;
                    }
                    if (this.field.attributeDefinition.AttributeType.toLowerCase() === 'rating') {
                        name = this.getRatingNoEntryString();
                        value = "None";
                    }
                    noEntryValues.push(this._convertToLabelValuePair(name, value));
                }

                store.loadRawData(noEntryValues.concat(labelValues));
                store.fireEvent('load', store, store.getRange(), success);
            },
            scope: this
        });
    },

    _hasStringValue: function(allowedValueObject) {
        return allowedValueObject.get('StringValue') !== "";
    }
});
