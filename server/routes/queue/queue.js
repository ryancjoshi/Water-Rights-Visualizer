const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const constants = require("../../constants");

const run_directory_base = constants.run_directory_base;

router.get("/list", (req, res) => {
  let report_queue_file = path.join(run_directory_base, "report_queue.json");

  if (!fs.existsSync(report_queue_file)) {
    fs.writeFileSync(report_queue_file, "[]");
    res.status(200).send([]);
    return;
  }

  fs.readFile(report_queue_file, (err, data) => {
    let report_queue = [];

    if (err) {
      console.error(`Error reading ${report_queue_file}`, err);
      res.status(500).send("Error reading report queue");
      return;
    }

    try {
      report_queue = JSON.parse(data);
    } catch (e) {
      console.error(`Error parsing JSON from ${report_queue_file}`);
      res.status(500).send("Error parsing report queue");
      return;
    }

    res.status(200).send(report_queue);
  });
});

router.delete("/delete_job", (req, res) => {
  let key = req.query.key;
  let deleteFiles = req.query.deleteFiles;

  if (!key) {
    res.status(400).send("Missing key");
    return;
  }

  let report_queue_file = path.join(run_directory_base, "report_queue.json");
  fs.readFile(report_queue_file, (err, data) => {
    let report_queue = [];

    if (err) {
      console.error(`Error reading ${report_queue_file}`);
      res.status(500).send("Error reading report queue");
      return;
    }

    try {
      report_queue = JSON.parse(data);
    } catch (e) {
      console.error(`Error parsing JSON from ${report_queue_file}`);
      res.status(500).send("Error parsing report queue");
      return;
    }

    let job = report_queue.find((entry) => entry.key === key);
    if (!job) {
      res.status(404).send("Job not found");
      return;
    }

    if (!["Complete", "Failed"].includes(job?.status) && job?.pid) {
      try {
        process.kill(job.pid, "SIGKILL");
      } catch (e) {
        console.error(`Error killing process ${job.pid}`, e);
      }
    }

    let new_report_queue = report_queue.filter((entry) => entry.key !== key);
    fs.writeFile(report_queue_file, JSON.stringify(new_report_queue), (err) => {
      if (err) {
        console.error(`Error writing ${report_queue_file}`);
        res.status(500).send("Error writing report queue");
        return;
      }
      res.status(200).send(new_report_queue);
    });

    if (deleteFiles && job.base_dir) {
      fs.rmdir(job.base_dir, { recursive: true }, (err) => {
        if (err) {
          console.error(`Error deleting ${job.base_dir}`, err);
        }
      });
    }
  });
});

module.exports = router;
