package br.ucs.webalgo.middleware.adapter.out.integration.solution;

import br.ucs.webalgo.middleware.adapter.out.integration.solution.dto.LegacySolutionDataResponse;
import br.ucs.webalgo.middleware.adapter.out.integration.solution.mapper.LegacySolutionMapper;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.FetchSolutionCommand;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.FetchSolutionResult;
import br.ucs.webalgo.middleware.application.port.out.solution.SolutionPort;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class LegacySolutionClient implements SolutionPort {

    private final WebClient client;
    private final LegacySolutionMapper solutionMapper;

    public LegacySolutionClient(WebClient client, LegacySolutionMapper solutionMapper) {
        this.client = client;
        this.solutionMapper = solutionMapper;
    }

    @Override
    public Mono<FetchSolutionResult> fetchSolutionData(FetchSolutionCommand command) {
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("codigoPS", command.code());

        return client.post()
                .uri("/dadosSolucao")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(form)
                .cookies(c -> {
                    c.add("sessionid", command.sessionId());
                    c.add("name", command.username());
                })
                .retrieve()
                .bodyToMono(LegacySolutionDataResponse.class)
                .map(solutionMapper::toResult);
    }
}
