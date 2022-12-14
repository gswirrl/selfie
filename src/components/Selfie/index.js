import React, { useState } from 'react'
import { Octokit } from '@octokit/rest'
import { Base64 } from 'js-base64'
import styled from 'styled-components'
import { CirclePicker } from 'react-color'
import toast from 'react-hot-toast'
import CONFIG from '../../config.json'

// these plaeholders are replaced on the fly into the source with github credentials by a githun action before compilation
const OWNER = '#{OWNER}#'
const REPO = '#{REPO}#'
const EMAIL = '#{EMAIL}#'

/*
const OWNER = || 'gswirrl'
const REPO = || 'selfie'
const EMAIL= || 'guy@swirrl.com'
*/

const USERNAME = `Selfie Bot`
const CONFIG_FILE = 'src/config.json'

const Note = styled.div`
	position: absolute;
	top: 1rem;
	left: 1rem;
	font-size: 14px;
`

const Button = styled.button`
	background: ${props => props.colour};
	color: #000;
	font-size: 2rem;
	font-weight: bold;
	border: 0;
	border-radius: 1rem;
`

const Label = styled.div`
	color: ${props => props.colour};
	font-size: 2rem;
	font-weight: bold;
`

const Spacer = styled.div`
	height: 1rem;
`

const Wrapper = styled.div`
	width: 50vw;
	flex: 0;
	padding: 2rem 3rem;
	background: #000;
	color: #fff;
	box-shadow: rgba(0, 0, 0, 0.09) 0px 2px 1px, rgba(0, 0, 0, 0.09) 0px 4px 2px,
		rgba(0, 0, 0, 0.09) 0px 8px 4px, rgba(0, 0, 0, 0.09) 0px 16px 8px,
		rgba(0, 0, 0, 0.09) 0px 32px 16px;

	input {
		font-size: 1.4rem;
		border-radius: 0;
		padding: 0.4rem;
	}
`

const All = styled.div`
	background: ${props => props.colour};
	height: 100vh;
	width: 100vw;
	display: flex;
	display: flex;
	align-items: center;
	justify-content: center;
`

const saveSelfie = async ({ token, data }) => {
	if (token) {
		const today = new Date()
		const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()
		const time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds()
		const timeStamp = date + ' ' + time
		const payload = Object.assign({ timeStamp: timeStamp }, data)
		const payloadJSON = JSON.stringify(payload)

		try {
			const octokit = new Octokit({ auth: token })
			const {
				data: { sha }
			} = await octokit.request('GET /repos/{owner}/{repo}/contents/{file_path}', {
				owner: OWNER,
				repo: REPO,
				file_path: CONFIG_FILE
			})
			// todo if this 404s then you havent uploaded your config file
			const contentEncoded = Base64.encode(payloadJSON)
			const { data } = await octokit.repos.createOrUpdateFileContents({
				owner: OWNER,
				repo: REPO,
				path: CONFIG_FILE,
				sha: sha,
				message: 'Selfie saved user config',
				content: contentEncoded,
				committer: {
					name: USERNAME,
					email: EMAIL // 422 without this
				},
				author: {
					name: USERNAME,
					email: EMAIL // 422 without this
				}
			})
			if (data) {
				toast.success('Successfully saved!')
			} else {
				toast.error("Sorry this didn't work.")
			}
		} catch (error) {
			console.log(
				`Error! Status: ${error.status}. Rate limit remaining: ${error.headers['x-ratelimit-remaining']}. Message: ${error.response.data.message}`
			)
			toast.error('Something went wrong: ' + error.status)
		}
		return
	}
	toast.error('Password required.')
}

export const Selfie = () => {
	const [token, setToken] = useState('')
	const [selectedColour, setBackgroundColour] = useState(CONFIG.backgroundColour)

	const handleChangeComplete = c => {
		setBackgroundColour(c.hex)
	}

	return (
		<All colour={selectedColour}>
			<Note>
				{selectedColour === CONFIG.backgroundColour
					? 'background colour was set at: ' + CONFIG.timeStamp
					: ' '}
			</Note>
			<Wrapper>
				<Label colour={selectedColour}>Configure</Label>
				<Spacer />
				<CirclePicker color={selectedColour} onChangeComplete={handleChangeComplete} />
				<Spacer />
				<Spacer />
				<Label colour={selectedColour}>Password</Label>
				<input
					type='password'
					name='password'
					id='password'
					value={token}
					onChange={e => setToken(e.target.value)}
				/>
				<Spacer />
				<Spacer />
				<Button
					colour={selectedColour}
					onClick={() =>
						saveSelfie({
							token: token,
							data: {
								backgroundColour: selectedColour
							}
						})
					}
				>
					Save
				</Button>
			</Wrapper>
		</All>
	)
}
