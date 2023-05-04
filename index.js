const axios = require("axios");
const querystring = require("querystring");

const {OPENAI_API_KEY} = process.env

async function getChatResponse(user_name, text, response_url) {
    let res

    try {
        res = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-3.5-turbo", // 모델 (gpt-4, gpt-4-0314, gpt-4-32k, gpt-4-32k-0314, gpt-3.5-turbo, gpt-3.5-turbo-0301)
            messages: [{role: "user", content: text}],
            temperature: 1, // 샘플링 0.0 ~ 2.0
            top_p: 1, // 샘플링 0.0 ~ 1.0
            n: 1, // 생성 채팅 수
            stream: false,
            stop: null, // 추가 토큰 생성 시퀀스
            // max_tokens: 100, // 최대 사용 토큰
            presence_penalty: 0, // -2.0 ~ 2.0
            frequency_penalty: 0, // -2.0 ~ 2.0
            user: user_name, // 사용자 이름
        }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`
            },
        })
    } catch (err) {
        console.error(err)

        await axios.post(response_url, {
            response_type: "in_channel",
            text: `(${err.response.status}}) Error: ${JSON.stringify(err.response.data)}`,
        });

        return {
            statusCode: err.response.status,
            body: JSON.stringify(err.response.data)
        }
    }

    console.log(`Response data: ${JSON.stringify(res.data)}`)

    let {data} = res
    let {choices, usage} = data
    let [{message, finish_reason}] = choices
    let {content} = message
    let {prompt_tokens, completion_tokens, total_tokens} = usage

    // not async
    await axios.post(response_url, {
        response_type: "in_channel",
        blocks: [{
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*${user_name}*: ${text}`
            }
        }, {
            type: "section",
            text: {
                type: "mrkdwn",
                text: content
            }
        }, {
            type: "section",
            fields: [
                {
                    type: "mrkdwn",
                    text: `*prompt_tokens:*
${prompt_tokens}`
                },
                {
                    type: "mrkdwn",
                    text: `*completion_tokens:*
${completion_tokens}`
                },
                {
                    type: "mrkdwn",
                    text: `*total_tokens:*
${total_tokens}`
                },
                {
                    type: "mrkdwn",
                    text: `*finish_reason:*
${finish_reason}`
                },
            ]
        },],
    }, {
        headers: {
            "Content-Type": "application/json",
        }
    });
}

module.exports.slash = async (event) => {
    let bodyString = Buffer.from(event.body, "base64").toString()
    let body = querystring.parse(bodyString)
    let {user_name, text, response_url} = body

    console.log(`Request body: ${bodyString}`)

    // TODO: 람다로 async 처리
    // await getChatResponse(user_name, text, response_url)

    return {
        statusCode: 200,
        body: JSON.stringify({
            response_type: "in_channel",
            text: "Processing...",
        }),
        headers: {
            "Content-Type": "application/json",
        }
    }
};
