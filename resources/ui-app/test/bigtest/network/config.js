// typical mirage config export
// http://www.ember-cli-mirage.com/docs/v0.4.x/configuration/
export default function config() {
  this.get('_/discovery/health', () => ([
    {
      instId: '7fdb35df-eba1-403e-8e7a-39bf7b38871f',
      srvcId: 'mod-inventory-storage-13.1.0-SNAPSHOT.184',
      healthMessage: 'OK',
      healthStatus: true
    },
    {
      instId: '7fdb35df-eba1-403e-8e7a-39bf7b38872f',
      srvcId: 'mod-inventory-storage-13.1.0-SNAPSHOT.184',
      healthMessage: 'OK',
      healthStatus: true
    },
    {
      instId: '7fdb35df-eba1-403e-8e7a-39bf7b38873f',
      srvcId: 'mod-inventory-storage-13.1.0-SNAPSHOT.184',
      healthMessage: 'Fail',
      healthStatus: false
    },
    {
      instId: '7fdb35df-eba1-403e-8e7a-39bf7b38874f',
      srvcId: 'mod-inventory-storage-13.1.0-SNAPSHOT.184',
      healthMessage: 'OK',
      healthStatus: true
    },
    {
      instId: '7fdb35df-eba1-403e-8e7a-39bf7b38875f',
      srvcId: 'mod-inventory-storage-13.1.0-SNAPSHOT.184',
      healthMessage: 'OK',
      healthStatus: true
    },
    {
      instId: '7fdb35df-eba1-403e-8e7a-39bf7b38876f',
      srvcId: 'mod-inventory-storage-13.1.0-SNAPSHOT.184',
      healthMessage: 'Fail',
      healthStatus: false
    }
  ]));
}
