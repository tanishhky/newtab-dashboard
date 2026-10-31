import unittest

from fetch_calendar import merge, normalize, wanted_calendar


class WantedCalendar(unittest.TestCase):
    def test_keeps_selected_calendars(self):
        self.assertTrue(wanted_calendar({"id": "ty2766@nyu.edu", "selected": True}))

    def test_skips_unselected_and_holidays(self):
        self.assertFalse(wanted_calendar({"id": "a@group.calendar.google.com", "selected": False}))
        self.assertFalse(wanted_calendar({"id": "en.usa#holiday@group.v.calendar.google.com", "selected": True}))


class Normalize(unittest.TestCase):
    def test_timed_event(self):
        item = {
            "summary": "Financial Economics — Lecture",
            "start": {"dateTime": "2026-11-03T11:00:00-05:00"},
            "end": {"dateTime": "2026-11-03T13:30:00-05:00"},
            "location": "Jacobs Hall\nBrooklyn",
            "iCalUID": "u1",
        }
        event = normalize(item, "NYU")
        self.assertEqual(event["title"], "Financial Economics - Lecture")
        self.assertEqual(event["location"], "Jacobs Hall")
        self.assertNotIn("allDay", event)

    def test_all_day_event(self):
        item = {"summary": "Registration", "start": {"date": "2026-11-16"}, "end": {"date": "2026-11-17"}, "id": "x"}
        event = normalize(item, "NYU")
        self.assertTrue(event["allDay"])
        self.assertEqual((event["start"], event["end"]), ("2026-11-16", "2026-11-17"))

    def test_cancelled_and_declined_are_dropped(self):
        base = {"start": {"dateTime": "2026-11-03T11:00:00-05:00"}, "end": {"dateTime": "2026-11-03T12:00:00-05:00"}}
        self.assertIsNone(normalize({**base, "status": "cancelled"}, "c"))
        declined = {**base, "attendees": [{"self": True, "responseStatus": "declined"}]}
        self.assertIsNone(normalize(declined, "c"))


class Merge(unittest.TestCase):
    def test_same_event_on_two_calendars_shows_once_and_sorted(self):
        shared = {"summary": "Seminar", "start": {"dateTime": "2026-11-05T17:00:00-05:00"},
                  "end": {"dateTime": "2026-11-05T18:00:00-05:00"}, "iCalUID": "same"}
        early = {"summary": "Class", "start": {"dateTime": "2026-11-05T11:00:00-05:00"},
                 "end": {"dateTime": "2026-11-05T12:00:00-05:00"}, "iCalUID": "other"}
        events = merge([("Personal", [shared]), ("NYU", [shared, early])])
        self.assertEqual([e["title"] for e in events], ["Class", "Seminar"])
        self.assertNotIn("_uid", events[0])


if __name__ == "__main__":
    unittest.main()
