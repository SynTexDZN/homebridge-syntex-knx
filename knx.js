var knx = require('knx');

var connection = knx.Connection({
	ipAddr : '192.168.188.88', ipPort : 3671,
	loglevel: 'error',
	//physAddr: '15.15.16',
	handlers: {
		connected : () => connectionSuccess(),
		event : (evt, src, dest, value) => handleEvent(evt, src, dest, value),
		error : (connstatus) => console.log("**** ERROR: %j", connstatus)
	}
});

function connectionSuccess()
{
	console.log('Connected!');
	// WRITE an arbitrary boolean request to a DPT1 group address
	//connection.write("1/0/0", 1);
	// you also WRITE to an explicit datapoint type, eg. DPT9.001 is temperature Celcius
	//connection.write("2/1/0", 22.5, "DPT9.001");
	// you can also issue a READ request and pass a callback to capture the response
	//connection.read("1/0/222", (src, responsevalue) => console.log(src, responsevalue));

	setTimeout(() => {
	
		connection.Disconnect();

		console.log('Disconnected!');
	
	}, 60000);
}

function handleEvent(evt, src, dest, value)
{
	var values = [];

	for(var i = 0; i < Object.keys(value).length; i++)
	{
		values.push(value[i]);
	}

	console.log("%j --> %j", dest, values);
}