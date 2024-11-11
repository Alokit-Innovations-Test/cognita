import React, { useState } from 'react'

import { LightTooltip } from '@/components/base/atoms/Tooltip'
import { useCreateApplicationMutation } from '@/stores/qafoundry'
import notify from '@/components/base/molecules/Notify'
import Button from '@/components/base/atoms/Button'
import Modal from '@/components/base/atoms/Modal'
import Input from '@/components/base/atoms/Input'
import { useDocsQAContext } from '../context'

const ApplicationModal = (props: any) => {
  const {
    allEnabledModels,
    selectedCollection,
    modelConfig,
    retrieverConfig,
    selectedQueryModel,
    selectedRetriever,
    promptTemplate,
    selectedQueryController,
  } = useDocsQAContext()

  const [createApplication, { isLoading: isCreateApplicationLoading }] =
    useCreateApplicationMutation()

  const { isCreateApplicationModalOpen, setIsCreateApplicationModalOpen } =
    props

  const [applicationName, setApplicationName] = useState('')
  const [questions, setQuestions] = useState<string[]>([])

  const pattern = /^[a-z][a-z0-9-]*$/
  const isValidApplicationName = pattern.test(applicationName)

  const createChatApplication = async (
    applicationName: string,
    questions: string[],
    setApplicationName: (name: string) => void,
  ) => {
    if (!applicationName) {
      return notify('error', 'Application name is required')
    }
    const selectedModel = allEnabledModels.find(
      (model: any) => model.name == selectedQueryModel,
    )

    try {
      await createApplication({
        name: `${applicationName}-rag-app`,
        config: {
          collection_name: selectedCollection,
          model_configuration: {
            name: selectedModel.name,
            provider: selectedModel.provider,
            ...JSON.parse(modelConfig),
          },
          retriever_name: selectedRetriever?.name ?? '',
          retriever_config: JSON.parse(retrieverConfig),
          prompt_template: promptTemplate,
          query_controller: selectedQueryController,
        },
        questions,
      }).unwrap()
      setApplicationName('')
      setIsCreateApplicationModalOpen(false)
      notify('success', 'Application created successfully')
    } catch (err: any) {
      notify('error', 'Failed to create application', err?.data?.detail)
    }
  }

  return (
    <Modal
      open={isCreateApplicationModalOpen}
      onClose={() => {
        setApplicationName('')
        setQuestions([])
        setIsCreateApplicationModalOpen(false)
      }}
    >
      <div className="modal-box">
        <div className="text-center font-medium text-xl mb-2">
          Create Application
        </div>
        <div>
          <div className="text-sm">Enter the name of the application</div>
          <Input
            value={applicationName}
            onChange={(e) => setApplicationName(e.target.value)}
            className="py-1 input-sm mt-1"
            placeholder="E.g. query-bot"
          />
          {applicationName && !isValidApplicationName ? (
            <div className="text-sm text-error mt-1">
              Application name should start with a lowercase letter and can only
              contain lowercase letters, numbers and hyphens
            </div>
          ) : applicationName ? (
            <div className="text-sm mt-1">
              The application name will be generated as{' '}
              <span className="font-medium">"{applicationName}-rag-app"</span>
            </div>
          ) : (
            <></>
          )}
          <div className="mt-2 text-sm">Questions (Optional)</div>
          {questions.map((question: any, index: any) => (
            <div className="flex items-center gap-2 mt-2 w-full">
              <div className="flex-1">
                <Input
                  key={index}
                  value={question}
                  onChange={(e) => {
                    const updatedQuestions = [...questions]
                    updatedQuestions[index] = e.target.value
                    setQuestions(updatedQuestions)
                  }}
                  className="py-1 input-sm w-full"
                  placeholder={`Question ${index + 1}`}
                  maxLength={100}
                />
              </div>
              <Button
                icon="trash-alt"
                className="btn-sm hover:bg-red-600 hover:border-white hover:text-white"
                onClick={() => {
                  setQuestions(questions.filter((_, i) => i !== index))
                }}
              />
            </div>
          ))}
          <LightTooltip
            title={
              questions.length === 4 ? 'Maximum 4 questions are allowed' : ''
            }
            size="fit"
          >
            <div className="w-fit">
              <Button
                text="Add Question"
                white
                disabled={questions.length == 4}
                className="text-sm font-medium text-gray-1000 hover:bg-white mt-2"
                onClick={() => {
                  if (questions.length < 4) {
                    setQuestions([...questions, ''])
                  }
                }}
              />
            </div>
          </LightTooltip>
        </div>
        <div className="flex justify-end w-full mt-4 gap-2">
          <Button
            text="Cancel"
            className="btn-sm"
            onClick={() => {
              setApplicationName('')
              setQuestions([])
              setIsCreateApplicationModalOpen(false)
            }}
          />
          <Button
            text="Create"
            className="btn-sm btn-neutral"
            loading={isCreateApplicationLoading}
            onClick={() =>
              createChatApplication(
                applicationName,
                questions,
                setApplicationName,
              )
            }
          />
        </div>
      </div>
    </Modal>
  )
}

export default ApplicationModal
