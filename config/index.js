module.exports = {
	config: {
		topic: "sample6",
		commitInterval: 5000,
		numberOfMessages: 1000,
		chunks: 4,
		consumerConsumeInterval: 2000,
		consumeBatch: 100,
		kafka_producer_authentication: {
			dr_cb: true,
			"request.required.acks": "all",
			"compression.type": "gzip",
			"metadata.broker.list": "localhost:9093",
			"security.protocol": "ssl",
			"ssl.key.location":
				"/var/www/html/poc/kafka-replay-commit/sslcerts/client_localhostclient.key",
			"ssl.key.password": "abcdefgh",
			"ssl.certificate.location":
				"/var/www/html/poc/kafka-replay-commit/sslcerts/client_localhostclient.pem",
			"ssl.ca.location":
				"/var/www/html/poc/kafka-replay-commit/sslcerts/ca-cert",
			"ssl.keystore.password": "abcdefgh",
			retries: 3,
			"api.version.request": true
		},
		kafka_consumer_authentication: {
			"group.id": "kafka2",
			"enable.auto.commit": false,
			// rebalance_cb: true,
			"metadata.broker.list": "localhost:9093",
			"security.protocol": "ssl",
			"ssl.key.location":
				"/var/www/html/poc/kafka-replay-commit/sslcerts/client_localhostclient.key",
			"ssl.key.password": "abcdefgh",
			"ssl.certificate.location":
				"/var/www/html/poc/kafka-replay-commit/sslcerts/client_localhostclient.pem",
			"ssl.ca.location":
				"/var/www/html/poc/kafka-replay-commit/sslcerts/ca-cert",
			"ssl.keystore.password": "abcdefgh",
			//                      "auto.offset.reset":"earliest",
			"api.version.request": true
		}
	}
};
