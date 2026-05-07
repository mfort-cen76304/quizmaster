package cz.scrumdojo.quizmaster.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

/**
 * Reads X-Test-Clock-At from each inbound request and stows the parsed Instant
 * in a ThreadLocal for the request thread's lifetime. RequestScopedTestClock
 * reads the ThreadLocal, returning per-request time. The ThreadLocal is cleared
 * in finally, so values do not leak across requests sharing a worker thread.
 *
 * Registered only under the e2e profile; production never sees this filter.
 */
@Component
@Profile("e2e")
public class TestClockHeaderFilter implements Filter {

    public static final String HEADER = "X-Test-Clock-At";
    static final ThreadLocal<Instant> CURRENT = new ThreadLocal<>();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        var header = ((HttpServletRequest) req).getHeader(HEADER);
        if (header != null && !header.isBlank()) {
            try {
                CURRENT.set(Instant.parse(header));
            } catch (Exception ignored) {
                // Malformed header: fall through to fallback clock for this request.
            }
        }
        try {
            chain.doFilter(req, res);
        } finally {
            CURRENT.remove();
        }
    }
}
