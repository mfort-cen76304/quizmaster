package cz.scrumdojo.quizmaster.config;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

/**
 * A Clock that returns the per-request override Instant set by
 * TestClockHeaderFilter, or falls back to a system clock when no header
 * is present. Singleton: state lives in the filter's ThreadLocal, not here.
 */
public class RequestScopedTestClock extends Clock {

    private final ZoneId zone;
    private final Clock fallback;

    public RequestScopedTestClock(ZoneId zone, Clock fallback) {
        this.zone = zone;
        this.fallback = fallback;
    }

    @Override
    public ZoneId getZone() {
        return zone;
    }

    @Override
    public Clock withZone(ZoneId zone) {
        return new RequestScopedTestClock(zone, fallback);
    }

    @Override
    public Instant instant() {
        var override = TestClockHeaderFilter.CURRENT.get();
        return override != null ? override : fallback.instant();
    }
}
