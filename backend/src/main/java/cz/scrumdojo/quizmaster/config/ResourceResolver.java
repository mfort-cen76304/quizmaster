package cz.scrumdojo.quizmaster.config;

import java.io.IOException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.resource.PathResourceResolver;

public class ResourceResolver extends PathResourceResolver {

    @Override
    protected Resource getResource(@NonNull String resourcePath, @NonNull Resource location) throws IOException {
        // Let DispatcherServlet handle API endpoints
        if (resourcePath.startsWith("api/")) {
            return null;
        }

        Resource requestedResource = location.createRelative(resourcePath);

        if (isStatic(requestedResource)) return requestedResource;
        else return indexHtml;
    }

    private boolean isStatic(Resource resource) {
        return resource.exists() && resource.isReadable();
    }

    private static final Resource indexHtml = new ClassPathResource("/static/index.html");
}
