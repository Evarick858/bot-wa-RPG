const SystemChecker = require('./system-checker');

(async () => {
  const checker = new SystemChecker();
  const results = await checker.runAllChecks();
  console.log(checker.generateReport());
  if (results.overall.status !== 'READY') {
    process.exit(1); // Exit code 1 jika ada masalah kritis
  } else {
    process.exit(0); // Exit code 0 jika semua OK
  }
})(); 