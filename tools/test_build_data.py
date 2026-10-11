import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import build_data as bd  # noqa: E402


class BucketTests(unittest.TestCase):
    def test_known_statuses(self):
        cases = {
            "Applied 2026-09-30 (Greenhouse confirmation 04:02 ET)": "applied",
            "Rejected 2026-10-05 (Workday email)": "rejected",
            "Assessment 2026-10-01 (Coderbyte, due by ~2026-10-08)": "assessment",
            "Selected (unpublished)": "selected",
            "Resume Ready (applications open 2026-12-01)": "ready",
            "Skipped": "closed",
            "Closed": "closed",
            "Interview 2026-10-14 (first round)": "assessment",
            "Withdrawn 2026-10-12": "closed",
            "Referral Intro": "other",
            "—": "other",
            "": "other",
        }
        for raw, expected in cases.items():
            with self.subTest(raw=raw):
                self.assertEqual(bd.bucket(raw), expected)

    def test_short_status_keeps_leading_clause(self):
        self.assertEqual(
            bd.short_status("Applied 2026-09-30 (IMC confirmation 02:45 ET)"),
            "Applied 2026-09-30",
        )
        self.assertEqual(
            bd.short_status("Rejected 2026-08-18 - ambiguous"),
            "Rejected 2026-08-18",
        )
        self.assertEqual(bd.short_status("Skipped"), "Skipped")


class DateTests(unittest.TestCase):
    def test_parse_log_date(self):
        self.assertEqual(bd.parse_log_date("5/22/26"), "2026-05-22")
        self.assertEqual(bd.parse_log_date("10/1/26"), "2026-10-01")
        self.assertIsNone(bd.parse_log_date("not a date"))


class LoadTests(unittest.TestCase):
    def test_load_applications_skips_blank_and_sorts_newest_first(self):
        csv_text = (
            "date,company,role,resume_path,status,fit,notes\n"
            "5/22/26,Alpha,Intern,p,Applied 2026-05-22 (x),,\n"
            ",,,,,,\n"
            "10/1/26,Beta,Analyst,p,Rejected 2026-10-01,,\n"
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "apps.csv"
            path.write_text(csv_text, encoding="utf-8")
            rows = bd.load_applications(path)
        self.assertEqual([r["company"] for r in rows], ["Beta", "Alpha"])
        self.assertEqual(rows[0]["bucket"], "rejected")

    def test_load_deadlines_rejects_bad_date(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "d.json"
            path.write_text('[{"title": "x", "date": "2026-13-40"}]', encoding="utf-8")
            with self.assertRaises(ValueError):
                bd.load_deadlines(path)


class SummaryTests(unittest.TestCase):
    def test_summary_is_embedded_when_present(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "summary.json"
            path.write_text('{"toSubmit": 3, "newLeads": 12}', encoding="utf-8")
            jobs = bd.load_summary(path)
        self.assertEqual(jobs["toSubmit"], 3)
        self.assertIn('"toSubmit": 3', bd.render([], [], jobs))

    def test_missing_or_broken_summary_is_none(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertIsNone(bd.load_summary(Path(tmp) / "absent.json"))
            bad = Path(tmp) / "bad.json"
            bad.write_text("{not json", encoding="utf-8")
            self.assertIsNone(bd.load_summary(bad))
        self.assertIn('"jobs": null', bd.render([], []))


if __name__ == "__main__":
    unittest.main()
