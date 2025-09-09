package br.ucs.webalgo.middleware.adapter.out.integration.problem;

import br.ucs.webalgo.middleware.adapter.out.integration.problem.dto.LegacySearchByKeyResponse;
import br.ucs.webalgo.middleware.adapter.out.integration.problem.mapper.LegacyProblemMapper;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.SearchByKeyCommand;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.SearchByKeyResult;
import br.ucs.webalgo.middleware.application.port.out.problem.ProblemPort;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class LegacyProblemClient implements ProblemPort {

    private final WebClient client;
    private final LegacyProblemMapper problemMapper;

    public LegacyProblemClient(WebClient client, LegacyProblemMapper problemMapper) {
        this.client = client;
        this.problemMapper = problemMapper;
    }

    public Mono<SearchByKeyResult> searchProblemByKey(SearchByKeyCommand command) {
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("pChave", "");
        form.add("pTipo", command.key());

        return client.post()
                .uri("/buscaProblemasChave")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(form)
                .cookies(c -> {
                    c.add("sessionid", command.sessionId());
                    c.add("name", command.username());
                })
                .retrieve()
                .bodyToMono(LegacySearchByKeyResponse.class)
                .map(problemMapper::toResult);
    }

}