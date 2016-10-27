Ext.define('Rally.technicalservices.CardConfiguration',{
    singleton: true,

    fetchFields: ["FormattedID","Name","Feature","Description",
        "Release","PlanEstimate",'c_ExtID01QCRequirement','c_ExtID01QCBug',
        'Requirement','Project','WorkProduct','Owner','Estimate'],
                
    displayFields: {
        r1left: { 
            dataIndex: 'FormattedID'
        },
        r1middle: {
            dataIndex: function(recordData) {
                var feature = recordData.get('Feature');
                
                if ( recordData.get('_type') == 'defect' && recordData.get('Requirement') ) {
                    feature = recordData.get('Requirement').Feature;
                }
                
                if ( recordData.get('_type') == 'task' && recordData.get('WorkProduct') ) {
                    feature = recordData.get('WorkProduct');
                }
                
                if ( Ext.isEmpty(feature) ) {
                    return ' ';
                }
                
                return feature.FormattedID + ": " + Ext.util.Format.substr(feature.Name,0,5);
            },
            maxLength: 12
        },
        r1right: {
            dataIndex: function(recordData){   
                var release = recordData.get('Release');
                if ( recordData.get('_type') == 'task' && recordData.get('WorkProduct') ) {
                    release = recordData.get('WorkProduct').Release;
                }
                
                var release_name = "No Release";
                if ( !Ext.isEmpty(release) ) {
                    release_name = release.Name;
                }
                return release_name;
            },
            maxLength: 15
        },
        r2middle: {
            dataIndex: function(recordData) {
                var name = recordData.get('Name');
                var description = recordData.get('Description');
                
                return Ext.String.format('<strong>{0}</strong><br/><br/>{1}',
                    name,
                    description
                );
            }
        },
        r3left: {
            dataIndex: function(recordData) {
                var qc_id = "";
                console.log('--', recordData);
                
                if(recordData.get('_type')=="hierarchicalrequirement"){
                    qc_id = 'QC: ' + recordData.get('c_ExtID01QCRequirement');
                }else if(recordData.get('_type')=="defect"){
                    qc_id = 'QC: ' + recordData.get('c_ExtID01QCBug');
                }else if(recordData.get('_type')=="task") {
                    qc_id = recordData.get('Owner') && recordData.get('Owner')._refObjectName;
                }
               
                return qc_id;
            }
        },
        r3middleleft: {
            dataIndex: function(recordData) {
                return Ext.String.ellipsis(recordData.get('Project').Name, 35);
            }
        },
        r3middleright: {
            dataIndex: function(recordData) {
                return  Ext.String.ellipsis(recordData.get('Owner') && recordData.get('Owner').Name, 35) || "No Owner";
            }
        },
        r3right: {
            dataIndex: function(recordData) {
                return recordData.get('PlanEstimate') || recordData.get('Estimate');
            }
        }
        
    }
});
