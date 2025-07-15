import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal'
import Button from './Button'
import { deleteUserAccount } from '../lib/supabase'
import { AlertTriangle } from 'lucide-react'

const DeleteAccountModal = ({ isOpen, onClose, userEmail }) => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const watchConfirmation = watch('confirmation')

  const onSubmit = async () => {
    setLoading(true)
    try {
      const { error } = await deleteUserAccount()
      
      if (error) {
        throw error
      }

      toast.success('Account deleted successfully')
      navigate('/')
    } catch (error) {
      console.error('Account deletion error:', error)
      toast.error(error.message || 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Account">
      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-red-800">
              This action cannot be undone
            </h4>
            <p className="text-sm text-red-700 mt-1">
              This will permanently delete your account and all associated data including:
            </p>
            <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
              <li>All businesses and reviews</li>
              <li>Customer data and review requests</li>
              <li>Widgets and analytics</li>
              <li>Subscription information</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-1">
              Type <strong>DELETE</strong> to confirm:
            </label>
            <input
              type="text"
              id="confirmation"
              {...register('confirmation', { 
                required: 'Please type DELETE to confirm',
                validate: value => value === 'DELETE' || 'You must type DELETE exactly'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Type DELETE here"
            />
            {errors.confirmation && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmation.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={loading || watchConfirmation !== 'DELETE'}
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default DeleteAccountModal