const EventEmitter = require('events');

module.exports = class EventManager extends EventEmitter
{
	constructor(logger)
	{
		super();

		super.setMaxListeners(512);
    
        this.logger = logger;
    }

    setInputStream(stream, sender, receiver, callback)
	{
		super.on(stream, (source, destination, value) => {
			
			if(source != sender && destination == receiver)
			{
				callback(value);

				this.logger.debug('<<< ' + stream + ' [' + receiver + '] ' + JSON.stringify(value));
			}
		});
	}

	setOutputStream(stream, sender, receiver, value)
	{
		super.emit(stream, sender, receiver, value);

		this.logger.debug('>>> ' + stream + ' [' + receiver + '] ' + JSON.stringify(value));
	}
}