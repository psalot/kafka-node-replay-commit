const chai = require("chai");
const uuid = require("uuid");

const _ = require("lodash");
const should = chai.should();
const async = require("async");
const Kafka = require("node-rdkafka");
const { config } = require("../config");
const topic = config.topic;
const producer = Kafka.Producer(config.kafka_producer_authentication);

var offsetCount;
let oldOffsetCount;
// const { consumer } = require("./dispatchConsumer");

const consumer = new Kafka.KafkaConsumer(
	Object.assign(config.kafka_consumer_authentication, {
		rebalance_cb: function(err, assignment) {
			// console.log("rebalancecb", assignment);
			try {
				if (err.code === Kafka.CODES.ERRORS.ERR__ASSIGN_PARTITIONS) {
					// this.assign(assignment);
					consumer.queryWatermarkOffsets(topic, 0, 4000, (error, offsets) => {
						console.log(offsets.lowOffset, offsets.highOffset);
						consumer.assign([
							{
								topic: topic,
								partition: 0
							}
						]);
						// console.log(consumer.position(), "consumer position after assign");
					});
				} else if (err.code == Kafka.CODES.ERRORS.ERR__REVOKE_PARTITIONS) {
					console.log(err.code, "else if error");
					this.unassign();
				} else {
					console.log(err, "else err");
				}
			} catch (err) {
				console.log(err);
			}
		}
	}),
	{
		"enable.auto.commit": false,
		"auto.offset.reset": "latest"
	}
);
describe("Should return true if produced message successfully", () => {
	const numberOfMessages = config.numberOfMessages;
	const chunkSize = config.chunks;

	let interval;
	before(done => {
		initConnect()
			.then(data => {
				producer.once("ready", function() {
					console.log("kafka ready");
				});

				return initConsumerConnect(topic);
			})
			.then(data => {
				console.log("in success");
				// sendUUIDMessages(numberOfMessages, topic, done);

				done();
			})
			.catch(err => {
				done(err);
			});
	});
	function sendUUIDMessages(times, topic, done) {
		return new Promise((resolve, reject) => {
			const allMessages = _.times(times, uuid.v4);
			const chunked = _.chunk(allMessages, times / chunkSize);
			console.log(
				`${allMessages.length} messages generated. Sending in ${
					chunked.length
				} chunks of ${times / chunkSize}`
			);
			let count = 0;
			async.each(
				chunked,
				function(messages, callback) {
					messages.forEach(messg => {
						producer.produce(
							topic,
							null,
							new Buffer.from(messg + " count " + count),
							null,
							Date.now()
						);
					});
				},
				done
			);
			resolve(producer);
		});
	}

	it("can consume messages", done => {
		// const groupId = uuid.v4();
		console.log(`starting to consume using groupId: `);
		const time = process.hrtime();

		let consumed = 0;
		consumer.once("data", function(data) {
			oldOffsetCount = data.offset;
			commitMessage();
		});
		consumer.on("data", function(data) {
			offsetCount = data.offset;
			if (++consumed === numberOfMessages) {
				const [seconds, nanoseconds] = process.hrtime(time);
				console.log(`took ${seconds}s ${nanoseconds / 1e6}ms`);

				// consumer.disconnect();
				producer.flush();
				producer.disconnect();
				// consumer.disconnect();
				// producer.close();

				done();
			}
		});
		consumer.on("error", function(err) {
			console.log(err);
			done(err);
		});

		interval = setInterval(function() {
			console.log(`consumed ${consumed}`);
		}, 5000);
	}).timeout(50000);

	after(done => {
		clearInterval(interval);

		done();
	});
	// console.log("in before");
});
function initConnect() {
	return new Promise((resolve, reject) => {
		producer.connect(null, (err, metadata) => {
			if (err) {
				reject(err);
			} else {
				console.log("Kafka Connected Successfully");
				resolve(producer);
			}
		});
		producer.on("error", function(err) {
			console.log("kafka error", err);
		});

		return producer;
	});
}
function initConsumerConnect(topic) {
	return new Promise((resolve, reject) => {
		consumer.connect(null, err => {
			if (err) {
				console.log("consumer connect error", err);
				reject(err);
			} else {
				console.log("Connection to consumer successful");
			}
		});
		consumer.on("rebalance", function() {
			console.log("rebalances");
		});
		consumer.on("ready", function() {
			consumer.subscribe([topic]);
			setInterval(function() {
				consumer.consume(config.consumeBatch);
			}, config.consumerConsumeInterval);
			resolve(consumer);
		});
	});
}

const commitMessage = () => {
	setInterval(() => {
		console.log(oldOffsetCount, offsetCount);
		if (offsetCount !== oldOffsetCount) {
			console.log("commit success");
			consumer.commitSync({
				topic: topic,
				partition: 0,
				offset: offsetCount + 1
			});
		}
		oldOffsetCount = offsetCount;
	}, config.commitInterval);
};
// consumer.on("data", function(data) {
// 	console.log("consumed data", data);
//
// console.log(consumer.position(), "consumer position");
//method 1 commit message
// const commitMessage = setInterval(() => {
// 	console.log(data.value.toString(), "commit message");
// 	consumer.commitMessage(data);
// 	console.log(consumer.position(), "consumer position commit");
// 	clearInterval(commitMessage);
// }, 10000);
// })
