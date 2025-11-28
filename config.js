// config.js
// Ce fichier contient les paramètres de la Blockchain.
// Il est séparé pour faciliter la maintenance et le changement de contrat.

const CONTRACT_ADDRESS = "0x27f362936AE9000FDBf0e01f1D6F611eCA971C42";

const CONTRACT_ABI = [
	{
		"inputs": [
			{ "internalType": "string", "name": "_fName", "type": "string" },
			{ "internalType": "string", "name": "_lName", "type": "string" },
			{ "internalType": "string", "name": "_dob", "type": "string" },
			{ "internalType": "uint256", "name": "_avg", "type": "uint256" }
		],
		"name": "addStudent",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "user", "type": "address" },
			{ "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" },
			{ "indexed": false, "internalType": "string", "name": "firstName", "type": "string" }
		],
		"name": "StudentAdded",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "getMyStudents",
		"outputs": [
			{
				"components": [
					{ "internalType": "uint256", "name": "id", "type": "uint256" },
					{ "internalType": "string", "name": "firstName", "type": "string" },
					{ "internalType": "string", "name": "lastName", "type": "string" },
					{ "internalType": "string", "name": "dob", "type": "string" },
					{ "internalType": "uint256", "name": "average", "type": "uint256" },
					{ "internalType": "bool", "name": "exists", "type": "bool" }
				],
				"internalType": "struct PersonalStudentRegistry.Student[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];